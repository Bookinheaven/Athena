import Streak from "../models/streakModel.js";
import DailyStats from "../models/dailyStatsModel.js";
import TaskOccurrence from "../models/taskOccurrenceModel.js";
import taskOccurrenceService from "./taskOccurrenceService.js";
import {
  toStartOfDayUTC,
  isSameDay,
  getProductDate,
  productDateToStart,
  productDateToEnd,
  resolveUserTimezone,
} from "../utils/dateUtils.js";

class StreakService {
  /**
   * Helper to compute task outcome metrics for an array of occurrences on a single day.
   *
   * @param {Array<object>} occurrences
   * @param {boolean} isCurrentDay
   * @returns {object}
   */
  evaluateOccurrencesArray(occurrences = [], isCurrentDay = false) {
    const totalPlanned = occurrences.length;
    let completed = 0;
    let partiallyCompleted = 0;
    let rescheduled = 0;
    let cancelled = 0;
    let missed = 0;
    let pending = 0;

    for (const occ of occurrences) {
      switch (occ.outcome) {
        case "completed":
          completed++;
          break;
        case "partially_completed":
          partiallyCompleted++;
          break;
        case "rescheduled":
          rescheduled++;
          break;
        case "cancelled":
          cancelled++;
          break;
        case "missed":
          missed++;
          break;
        case "pending":
          pending++;
          break;
        default:
          break;
      }
    }

    const effectivePlanned = totalPlanned - rescheduled - cancelled;
    const weightedCompleted = completed * 1.0 + partiallyCompleted * 0.5;
    const completionRate =
      effectivePlanned > 0 ? weightedCompleted / effectivePlanned : 0;

    let state = "neutral";
    let resultType = "neutral";

    if (effectivePlanned === 0) {
      state = "neutral";
      resultType = "neutral";
    } else if (completionRate >= 0.8) {
      state = "green";
      resultType = "success";
    } else {
      if (isCurrentDay && pending > 0) {
        // Current day is still in progress / undecided
        state = "neutral";
        resultType = "neutral";
      } else {
        if (completionRate > 0) {
          state = "yellow";
          resultType = "partial";
        } else {
          state = "red";
          resultType = "failed";
        }
      }
    }

    return {
      totalPlanned,
      effectivePlanned,
      completed,
      partiallyCompleted,
      rescheduled,
      cancelled,
      missed,
      pending,
      completionRate,
      state,
      resultType,
    };
  }

  /**
   * Retrieve summary streak data for dashboard / overview.
   */
  async getSummaryData(userId, asOfDate = new Date(), timezone = null) {
    const streakData = await this.processDailyStreak(userId, asOfDate, timezone);
    const streak = await Streak.findOne({ userId });

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      freezeBalance: streak.freezeBalance,
      totalFreezesUsed: streak.totalFreezesUsed,
      maxFreezeBalance: streak.maxFreezeBalance,
      dailyTargetMinutes: streak.dailyTargetMinutes,
      minTargetMinutes: streak.minTargetMinutes,
      maxTargetMinutes: streak.maxTargetMinutes,
      lastTargetReason: streak.lastTargetReason,
      lastCountedDate: streak.lastCountedDate,
      ...streakData,
    };
  }

  /**
   * Main unified daily outcome and streak evaluation engine.
   *
   * @param {string | mongoose.Types.ObjectId} userId
   * @param {Date | string} [asOfDate=new Date()]
   * @param {string} [timezone=null]
   */
  async processDailyStreak(userId, asOfDate = new Date(), timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(asOfDate, tz);
    const today = toStartOfDayUTC(todayProductDate, "UTC");

    let streak = await Streak.findOne({ userId });
    if (!streak) {
      streak = await Streak.create({ userId });
    }

    // 1. Transition past pending occurrences (before today in user's timezone) to "missed"
    await taskOccurrenceService.evaluateMissedOccurrences(userId, asOfDate, tz);

    // 2. Load all historical occurrences and DailyStats before today
    // Query supports both new records with productDate and legacy records with date
    const [allPastOccurrences, allPastStats] = await Promise.all([
      TaskOccurrence.find({
        userId,
        $or: [
          { productDate: { $lt: todayProductDate } },
          { productDate: { $exists: false }, date: { $lt: today } },
        ],
      }),
      DailyStats.find({
        userId,
        $or: [
          { productDate: { $lt: todayProductDate } },
          { productDate: { $exists: false }, date: { $lt: today } },
        ],
      }),
    ]);

    // Group past occurrences by product day string
    const pastOccsByDate = new Map();
    for (const occ of allPastOccurrences) {
      const pDate = occ.productDate || getProductDate(occ.date, "UTC");
      if (!pastOccsByDate.has(pDate)) {
        pastOccsByDate.set(pDate, []);
      }
      pastOccsByDate.get(pDate).push(occ);
    }

    // Group past stats by product day string
    const pastStatsByDate = new Map();
    for (const stat of allPastStats) {
      const pDate = stat.productDate || getProductDate(stat.date, "UTC");
      pastStatsByDate.set(pDate, stat);
    }

    // Collect all unique past product dates that have occurrences or stats
    const uniquePastDates = Array.from(
      new Set([
        ...Array.from(pastOccsByDate.keys()),
        ...Array.from(pastStatsByDate.keys()),
      ]),
    ).sort();

    // Replay chronological running streak across past days
    let runningStreak = 0;
    let maxHistoricalStreak = streak.longestStreak || 0;
    let lastPastCountedDate = null;

    for (const pDate of uniquePastDates) {
      const dayDate = toStartOfDayUTC(pDate, "UTC");
      const occurrences = pastOccsByDate.get(pDate) || [];
      const dayEval = this.evaluateOccurrencesArray(occurrences, false);

      if (dayEval.state === "green") {
        runningStreak += 1;
        lastPastCountedDate = dayDate;
        if (runningStreak > maxHistoricalStreak) {
          maxHistoricalStreak = runningStreak;
        }
      } else if (dayEval.state === "yellow" || dayEval.state === "red") {
        runningStreak = 0;
      }
      // Neutral day (effectivePlanned === 0): streak does not change

      // Upsert / update DailyStats for this past day
      const existingStat = pastStatsByDate.get(pDate);
      await DailyStats.findOneAndUpdate(
        { userId, date: dayDate },
        {
          $set: {
            productDate: pDate,
            dailyTargetMinutes:
              existingStat?.dailyTargetMinutes ||
              streak.dailyTargetMinutes ||
              25,
            streakRate: dayEval.completionRate,
            completionRate: dayEval.completionRate,
            state: dayEval.state,
            resultType: dayEval.resultType,
            streakCount: runningStreak,
            tasksCompleted: dayEval.completed,
            tasksPartiallyCompleted: dayEval.partiallyCompleted,
            tasksRescheduled: dayEval.rescheduled,
            tasksMissed: dayEval.missed,
            tasksCancelled: dayEval.cancelled,
            totalPlanned: dayEval.totalPlanned,
            effectivePlanned: dayEval.effectivePlanned,
          },
          $setOnInsert: {
            focusMinutes: 0,
            sessions: 0,
            usedFreeze: 0,
          },
        },
        { upsert: true, new: true },
      );
    }

    // 3. Evaluate today
    const todayOccurrences = await TaskOccurrence.find({
      userId,
      $or: [
        { productDate: todayProductDate },
        { productDate: { $exists: false }, date: today },
      ],
    });
    const todayEval = this.evaluateOccurrencesArray(todayOccurrences, true);

    let currentStreak = runningStreak;
    let todayCountedDate = lastPastCountedDate;

    if (todayEval.state === "green") {
      currentStreak = runningStreak + 1;
      todayCountedDate = today;
      if (currentStreak > maxHistoricalStreak) {
        maxHistoricalStreak = currentStreak;
      }
    } else {
      // Today is in-progress / undecided or <80%. Today does not break streak while it is today.
      currentStreak = runningStreak;
    }

    streak.currentStreak = currentStreak;
    streak.longestStreak = maxHistoricalStreak;
    streak.lastProcessedDate = today;
    streak.lastCountedDate = todayCountedDate;
    await streak.save();

    // 4. Update DailyStats for today
    const stats = await DailyStats.findOneAndUpdate(
      { userId, date: today },
      {
        $set: {
          productDate: todayProductDate,
          dailyTargetMinutes: streak.dailyTargetMinutes || 25,
          streakRate: todayEval.completionRate,
          completionRate: todayEval.completionRate,
          state: todayEval.state,
          resultType: todayEval.resultType,
          streakCount: streak.currentStreak,
          tasksCompleted: todayEval.completed,
          tasksPartiallyCompleted: todayEval.partiallyCompleted,
          tasksRescheduled: todayEval.rescheduled,
          tasksMissed: todayEval.missed,
          tasksCancelled: todayEval.cancelled,
          totalPlanned: todayEval.totalPlanned,
          effectivePlanned: todayEval.effectivePlanned,
        },
        $setOnInsert: {
          focusMinutes: 0,
          sessions: 0,
          usedFreeze: 0,
        },
      },
      { upsert: true, new: true },
    );

    return {
      state: todayEval.state,
      resultType: todayEval.resultType,
      focusMinutes: stats.focusMinutes || 0,
      sessions: stats.sessions || 0,
      streakCount: streak.currentStreak,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      plannedCount: todayEval.totalPlanned,
      effectivePlanned: todayEval.effectivePlanned,
      completedCount: todayEval.completed,
      partialCount: todayEval.partiallyCompleted,
      rescheduledCount: todayEval.rescheduled,
      missedCount: todayEval.missed,
      cancelledCount: todayEval.cancelled,
      completionRate: todayEval.completionRate,
      streakRate: todayEval.completionRate,
      freezeUsed: stats.usedFreeze || 0,
    };
  }

  /**
   * Focus session completion/abandon updates focusMinutes and sessions.
   * Separate from task completion and daily streak outcome.
   */
  async dailyStreakUpdate(userId, sessionMinutes, sessionDate = new Date(), timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const productDate = getProductDate(sessionDate, tz);
    const day = toStartOfDayUTC(productDate, "UTC");

    let streak = await Streak.findOne({ userId });
    if (!streak) {
      streak = await Streak.create({ userId });
    }

    const target = Math.max(streak.dailyTargetMinutes || 25, 1);

    await DailyStats.findOneAndUpdate(
      { userId, date: day },
      {
        $set: { productDate },
        $inc: {
          focusMinutes: Math.round(sessionMinutes),
          sessions: 1,
        },
        $setOnInsert: {
          dailyTargetMinutes: target,
          streakRate: 0,
          completionRate: 0,
          totalPlanned: 0,
          effectivePlanned: 0,
          tasksCompleted: 0,
          tasksPartiallyCompleted: 0,
          tasksRescheduled: 0,
          tasksMissed: 0,
          tasksCancelled: 0,
          state: "neutral",
          resultType: "neutral",
          streakCount: streak.currentStreak || 0,
          usedFreeze: 0,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
  }

  async getSpecificField(userId, type) {
    let data = await Streak.findOne({ userId }).select(`${type} -_id`);
    if (!data) {
      await this.processDailyStreak(userId);
      data = await Streak.findOne({ userId }).select(`${type} -_id`);
    }
    return data;
  }

  async getMonthlyStats(userId, year, month, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    await this.processDailyStreak(userId, new Date(), tz);

    const parsedYear = parseInt(year, 10) || new Date().getUTCFullYear();
    const parsedMonth = parseInt(month, 10) || new Date().getUTCMonth() + 1;

    const monthStr = String(parsedMonth).padStart(2, "0");
    const daysInMonth = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();
    const startPDate = `${parsedYear}-${monthStr}-01`;
    const endPDate = `${parsedYear}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`;

    const startUTC = toStartOfDayUTC(startPDate, "UTC");
    const endUTC = new Date(Date.UTC(parsedYear, parsedMonth - 1, daysInMonth, 23, 59, 59, 999));

    return await DailyStats.find({
      userId,
      $or: [
        { productDate: { $gte: startPDate, $lte: endPDate } },
        { productDate: { $exists: false }, date: { $gte: startUTC, $lte: endUTC } },
      ],
    }).sort({ date: 1 });
  }
}

export default new StreakService();
