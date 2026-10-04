import streakRepository from "../repositories/streakRepository.js";
import dailyStatsRepository from "../repositories/dailyStatsRepository.js";
import taskOccurrenceRepository from "../repositories/taskOccurrenceRepository.js";
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
    const streak = await streakRepository.findByUserId(userId);

    return {
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      freezeBalance: streak?.freezeBalance ?? 3,
      totalFreezesUsed: streak?.totalFreezesUsed ?? 0,
      maxFreezeBalance: streak?.maxFreezeBalance ?? 3,
      dailyTargetMinutes: streak?.dailyTargetMinutes ?? 25,
      minTargetMinutes: streak?.minTargetMinutes ?? 20,
      maxTargetMinutes: streak?.maxTargetMinutes ?? 90,
      lastTargetReason: streak?.lastTargetReason ?? "no_change",
      lastCountedDate: streak?.lastCountedDate ?? null,
      ...streakData,
    };
  }

  /**
   * Main unified daily outcome and streak evaluation engine.
   *
   * @param {string} userId
   * @param {Date | string} [asOfDate=new Date()]
   * @param {string} [timezone=null]
   */
  async processDailyStreak(userId, asOfDate = new Date(), timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(asOfDate, tz);
    const today = toStartOfDayUTC(todayProductDate, "UTC");

    let pgStreak = await streakRepository.findByUserId(userId).catch(() => null);
    if (!pgStreak) {
      pgStreak = await streakRepository.createForUser(userId).catch(() => null);
    }

    const streak = pgStreak || { currentStreak: 0, longestStreak: 0, dailyTargetMinutes: 25 };

    // 1. Transition past pending occurrences (before today in user's timezone) to "missed"
    await taskOccurrenceService.evaluateMissedOccurrences(userId, asOfDate, tz);

    // 2. Load all historical occurrences and DailyStats before today
    const allPastOccurrences = await taskOccurrenceRepository.findPastOccurrences(userId, todayProductDate);
    const allPastStats = await dailyStatsRepository.findPastStats(userId, todayProductDate);

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
      const statPayload = {
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
      };

      await dailyStatsRepository.upsert(userId, pDate, statPayload);
    }

    // 3. Evaluate today
    const todayOccurrences = await taskOccurrenceRepository.findByUserAndDate(userId, todayProductDate);
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

    await streakRepository.update(userId, {
      currentStreak,
      longestStreak: maxHistoricalStreak,
      lastProcessedDate: todayProductDate,
      lastCountedDate: todayCountedDate ? (typeof todayCountedDate === "string" ? todayCountedDate : todayCountedDate.toISOString().slice(0, 10)) : null,
    });

    // 4. Update DailyStats for today
    const todayStatPayload = {
      dailyTargetMinutes: streak.dailyTargetMinutes || 25,
      streakRate: todayEval.completionRate,
      completionRate: todayEval.completionRate,
      state: todayEval.state,
      resultType: todayEval.resultType,
      streakCount: currentStreak,
      tasksCompleted: todayEval.completed,
      tasksPartiallyCompleted: todayEval.partiallyCompleted,
      tasksRescheduled: todayEval.rescheduled,
      tasksMissed: todayEval.missed,
      tasksCancelled: todayEval.cancelled,
      totalPlanned: todayEval.totalPlanned,
      effectivePlanned: todayEval.effectivePlanned,
    };

    const stats = (await dailyStatsRepository.upsert(userId, todayProductDate, todayStatPayload)) || {};

    return {
      state: todayEval.state,
      resultType: todayEval.resultType,
      focusMinutes: stats.focusMinutes || 0,
      sessions: stats.sessions || stats.sessionCount || 0,
      streakCount: currentStreak,
      currentStreak: currentStreak,
      longestStreak: maxHistoricalStreak,
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

    await dailyStatsRepository.incrementFocus(userId, productDate, sessionMinutes);
  }

  async getSpecificField(userId, type) {
    const pgStreak = await streakRepository.findByUserId(userId).catch(() => null);
    if (pgStreak && pgStreak[type] !== undefined) {
      return { [type]: pgStreak[type] };
    }

    await this.processDailyStreak(userId);
    const updatedPg = await streakRepository.findByUserId(userId).catch(() => null);
    if (updatedPg && updatedPg[type] !== undefined) {
      return { [type]: updatedPg[type] };
    }
    return {};
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

    return await dailyStatsRepository.findByUserAndDateRange(userId, startPDate, endPDate).catch(() => []);
  }
}

export default new StreakService();
