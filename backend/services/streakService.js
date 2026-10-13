import streakRepository from "../repositories/streakRepository.js";
import dailyStatsRepository from "../repositories/dailyStatsRepository.js";
import taskOccurrenceRepository from "../repositories/taskOccurrenceRepository.js";
import taskOccurrenceService from "./taskOccurrenceService.js";
import sessionRepository from "../repositories/sessionRepository.js";
import {
  calculateAdaptiveTarget,
  formatTargetRecommendation,
  getPrecedingDateWindow,
} from "../utils/targetEngine.js";
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
    const adaptiveTarget = await this.evaluateAdaptiveTarget(userId, asOfDate, timezone).catch(() => null);

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
      adaptiveTarget,
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

  /**
   * Evaluates the adaptive focus target recommendation based on historical consistency.
   *
   * @param {string} userId
   * @param {Date | string} [asOfDate=new Date()]
   * @param {string} [timezone=null]
   * @returns {Promise<object>}
   */
  async evaluateAdaptiveTarget(userId, asOfDate = new Date(), timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const targetProductDate = getProductDate(asOfDate, tz);

    let streak = await streakRepository.findByUserId(userId).catch(() => null);
    if (!streak) {
      streak = (await streakRepository.createForUser(userId).catch(() => null)) || {
        dailyTargetMinutes: 25,
        minTargetMinutes: 20,
        maxTargetMinutes: 90,
      };
    }

    const { windowStart, windowEnd } = getPrecedingDateWindow(targetProductDate, 14);
    const pastStats = await dailyStatsRepository
      .findByUserAndDateRange(userId, windowStart, windowEnd)
      .catch(() => []);

    const decision = calculateAdaptiveTarget(pastStats, targetProductDate, {
      currentTargetMinutes: streak.dailyTargetMinutes ?? 25,
      minTargetMinutes: streak.minTargetMinutes ?? 20,
      maxTargetMinutes: streak.maxTargetMinutes ?? 90,
    });

    const projection = formatTargetRecommendation(decision);

    return {
      ...decision,
      ...projection,
      lastTargetReason: streak.lastTargetReason || "no_change",
    };
  }

  /**
   * Applies or accepts the adaptive daily target recommendation.
   *
   * SAFETY GUARANTEE:
   * Target changes are strictly rejected if an active focus session is running.
   *
   * @param {string} userId
   * @param {number|null} [requestedTarget=null]
   * @param {string} [timezone=null]
   * @returns {Promise<object>}
   */
  async applyAdaptiveTarget(userId, requestedTarget = null, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));

    // Safety guard: Reject changes during active Focus sessions
    const activeSession = await sessionRepository.findActiveSession(userId).catch(() => null);
    if (activeSession) {
      const err = new Error("Daily focus target cannot be modified during an active Focus session.");
      err.statusCode = 409;
      throw err;
    }

    let streak = await streakRepository.findByUserId(userId);
    if (!streak) {
      streak = await streakRepository.createForUser(userId);
    }

    let newTarget;
    let reason;

    if (requestedTarget === null || requestedTarget === undefined) {
      const recommendation = await this.evaluateAdaptiveTarget(userId, new Date(), tz);
      newTarget = recommendation.proposedTargetMinutes;
      reason =
        recommendation.direction === "increase"
          ? "increase_consistency"
          : recommendation.direction === "decrease"
          ? "decrease_burnout"
          : "no_change";
    } else {
      const targetNum = Math.round(Number(requestedTarget));
      if (isNaN(targetNum) || targetNum <= 0) {
        const err = new Error("Target minutes must be a positive integer.");
        err.statusCode = 400;
        throw err;
      }
      const min = streak.minTargetMinutes ?? 20;
      const max = streak.maxTargetMinutes ?? 90;
      newTarget = Math.max(min, Math.min(targetNum, max));
      reason =
        newTarget > streak.dailyTargetMinutes
          ? "increase_consistency"
          : newTarget < streak.dailyTargetMinutes
          ? "decrease_burnout"
          : "no_change";
    }

    const updatedStreak = await streakRepository.update(userId, {
      dailyTargetMinutes: newTarget,
      lastTargetReason: reason,
    });

    // Synchronize today's DailyStats if it exists
    const todayProductDate = getProductDate(new Date(), tz);
    await dailyStatsRepository.upsert(userId, todayProductDate, {
      dailyTargetMinutes: newTarget,
    });

    const recommendation = await this.evaluateAdaptiveTarget(userId, new Date(), tz);

    return {
      streak: updatedStreak,
      dailyTargetMinutes: newTarget,
      lastTargetReason: reason,
      recommendation,
    };
  }

  /**
   * User-controlled target configuration (bounds & current target).
   *
   * @param {string} userId
   * @param {object} settings
   * @returns {Promise<object>}
   */
  async updateTargetSettings(userId, settings = {}) {
    const activeSession = await sessionRepository.findActiveSession(userId).catch(() => null);
    if (activeSession) {
      const err = new Error("Target settings cannot be modified during an active Focus session.");
      err.statusCode = 409;
      throw err;
    }

    let streak = await streakRepository.findByUserId(userId);
    if (!streak) {
      streak = await streakRepository.createForUser(userId);
    }

    const updatePayload = {};

    let min = settings.minTargetMinutes !== undefined
      ? Math.max(5, Math.round(Number(settings.minTargetMinutes)))
      : (streak.minTargetMinutes ?? 20);

    let max = settings.maxTargetMinutes !== undefined
      ? Math.max(min, Math.round(Number(settings.maxTargetMinutes)))
      : (streak.maxTargetMinutes ?? 90);

    if (min > max) {
      const err = new Error("Minimum target cannot be greater than maximum target.");
      err.statusCode = 400;
      throw err;
    }

    updatePayload.minTargetMinutes = min;
    updatePayload.maxTargetMinutes = max;

    if (settings.dailyTargetMinutes !== undefined) {
      const requested = Math.round(Number(settings.dailyTargetMinutes));
      updatePayload.dailyTargetMinutes = Math.max(min, Math.min(requested, max));
    } else {
      updatePayload.dailyTargetMinutes = Math.max(min, Math.min(streak.dailyTargetMinutes, max));
    }

    const updated = await streakRepository.update(userId, updatePayload);
    return updated;
  }
}

export default new StreakService();
