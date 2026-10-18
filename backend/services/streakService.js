import streakRepository from "../repositories/streakRepository.js";
import dailyStatsRepository from "../repositories/dailyStatsRepository.js";
import taskOccurrenceRepository from "../repositories/taskOccurrenceRepository.js";
import taskOccurrenceService from "./taskOccurrenceService.js";
import routineOccurrenceRepository from "../repositories/routineOccurrenceRepository.js";
import routineService from "./routineService.js";
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
   * Helper to compute unified task & routine commitment outcome metrics on a single day.
   *
   * @param {Array<object>} taskOccurrences
   * @param {Array<object>} routineOccurrences
   * @param {boolean} isCurrentDay
   * @returns {object}
   */
  evaluateCommitmentsArray(taskOccurrences = [], routineOccurrences = [], isCurrentDay = false) {
    // 1. Task outcomes
    const tasksTotalPlanned = taskOccurrences.length;
    let tasksCompleted = 0;
    let tasksPartiallyCompleted = 0;
    let tasksRescheduled = 0;
    let tasksCancelled = 0;
    let tasksMissed = 0;
    let tasksPending = 0;

    for (const occ of taskOccurrences) {
      switch (occ.outcome) {
        case "completed":
          tasksCompleted++;
          break;
        case "partially_completed":
          tasksPartiallyCompleted++;
          break;
        case "rescheduled":
          tasksRescheduled++;
          break;
        case "cancelled":
          tasksCancelled++;
          break;
        case "missed":
          tasksMissed++;
          break;
        case "pending":
          tasksPending++;
          break;
        default:
          break;
      }
    }

    const tasksEffectivePlanned = tasksTotalPlanned - tasksRescheduled - tasksCancelled;
    const taskWeightedCompleted = tasksCompleted * 1.0 + tasksPartiallyCompleted * 0.5;

    // 2. Routine outcomes
    // Filter out occurrences for archived routines if any were retrieved
    const activeRoutineOccs = routineOccurrences.filter(
      (r) => r.routineStatus !== "archived" && r.status !== "archived"
    );
    const routinesTotalPlanned = activeRoutineOccs.length;
    let routinesCompleted = 0;
    let routinesSkipped = 0;
    let routinesMissed = 0;
    let routinesPending = 0;

    for (const r of activeRoutineOccs) {
      switch (r.status) {
        case "completed":
          routinesCompleted++;
          break;
        case "skipped":
          routinesSkipped++;
          break;
        case "missed":
          routinesMissed++;
          break;
        case "in_progress":
        case "pending":
          routinesPending++;
          break;
        default:
          break;
      }
    }

    // Skipped routines excluded from effective planned denominator
    const routinesEffectivePlanned = routinesTotalPlanned - routinesSkipped;
    const routineWeightedCompleted = routinesCompleted * 1.0; // zero credit for partial step completion

    // 3. Combined Commitments
    const totalPlanned = tasksTotalPlanned + routinesTotalPlanned;
    const effectivePlanned = tasksEffectivePlanned + routinesEffectivePlanned;
    const completedCommitments = tasksCompleted + routinesCompleted;
    const weightedCompleted = taskWeightedCompleted + routineWeightedCompleted;
    const completionRate = effectivePlanned > 0 ? weightedCompleted / effectivePlanned : 0;
    const pendingCommitments = tasksPending + routinesPending;

    // 4. Threshold & State Evaluation (80% threshold, neutral day when 0 effective)
    let state = "neutral";
    let resultType = "neutral";

    if (effectivePlanned === 0) {
      state = "neutral";
      resultType = "neutral";
    } else if (completionRate >= 0.8) {
      state = "green";
      resultType = "success";
    } else {
      if (isCurrentDay && pendingCommitments > 0) {
        // Current day is still in progress / undecided while commitments remain pending
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
      // Combined totals
      totalPlanned,
      effectivePlanned,
      completedCommitments,
      completionRate,
      state,
      resultType,

      // Task breakdown (preserved for existing callers/tests)
      tasksTotalPlanned,
      tasksEffectivePlanned,
      tasksCompleted,
      tasksPartiallyCompleted,
      tasksRescheduled,
      tasksCancelled,
      tasksMissed,
      tasksPending,
      completed: tasksCompleted,
      partiallyCompleted: tasksPartiallyCompleted,
      rescheduled: tasksRescheduled,
      cancelled: tasksCancelled,
      missed: tasksMissed,
      pending: tasksPending,

      // Routine breakdown
      routinesTotalPlanned,
      routinesEffectivePlanned,
      routinesCompleted,
      routinesSkipped,
      routinesMissed,
      routinesPending,
    };
  }

  /**
   * Preserved compatibility helper for task-only callers.
   */
  evaluateOccurrencesArray(occurrences = [], isCurrentDay = false) {
    return this.evaluateCommitmentsArray(occurrences, [], isCurrentDay);
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

    // 1. Transition past pending task and routine occurrences (before today in user's timezone) to "missed"
    await taskOccurrenceService.evaluateMissedOccurrences(userId, asOfDate, tz);
    await routineService.evaluateMissedOccurrences(userId, asOfDate, tz);

    // 2. Load all historical occurrences and DailyStats before today
    const [allPastOccurrences, allPastRoutineOccurrences, allPastStats] =
      await Promise.all([
        taskOccurrenceRepository.findPastOccurrences(userId, todayProductDate),
        routineOccurrenceRepository.findPastOccurrences(userId, todayProductDate),
        dailyStatsRepository.findPastStats(userId, todayProductDate),
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

    // Group past routine occurrences by product day string
    const pastRoutinesByDate = new Map();
    for (const occ of allPastRoutineOccurrences) {
      const pDate =
        occ.productDate ||
        (occ.date instanceof Date
          ? occ.date.toISOString().slice(0, 10)
          : String(occ.date).slice(0, 10));
      if (!pastRoutinesByDate.has(pDate)) {
        pastRoutinesByDate.set(pDate, []);
      }
      pastRoutinesByDate.get(pDate).push(occ);
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
        ...Array.from(pastRoutinesByDate.keys()),
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
      const routineOccs = pastRoutinesByDate.get(pDate) || [];
      const dayEval = this.evaluateCommitmentsArray(occurrences, routineOccs, false);

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
        tasksCompleted: dayEval.tasksCompleted,
        tasksPartiallyCompleted: dayEval.tasksPartiallyCompleted,
        tasksRescheduled: dayEval.tasksRescheduled,
        tasksMissed: dayEval.tasksMissed,
        tasksCancelled: dayEval.tasksCancelled,
        totalPlanned: dayEval.totalPlanned,
        effectivePlanned: dayEval.effectivePlanned,
      };

      await dailyStatsRepository.upsert(userId, pDate, statPayload);
    }

    // 3. Evaluate today
    const [todayOccurrences, todayRoutineOccurrences] = await Promise.all([
      taskOccurrenceRepository.findByUserAndDate(userId, todayProductDate),
      routineOccurrenceRepository.findByUserAndDate(userId, todayProductDate),
    ]);
    const todayEval = this.evaluateCommitmentsArray(
      todayOccurrences,
      todayRoutineOccurrences,
      true
    );

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
      lastCountedDate: todayCountedDate
        ? typeof todayCountedDate === "string"
          ? todayCountedDate
          : todayCountedDate.toISOString().slice(0, 10)
        : null,
    });

    // 4. Update DailyStats for today
    const todayStatPayload = {
      dailyTargetMinutes: streak.dailyTargetMinutes || 25,
      streakRate: todayEval.completionRate,
      completionRate: todayEval.completionRate,
      state: todayEval.state,
      resultType: todayEval.resultType,
      streakCount: currentStreak,
      tasksCompleted: todayEval.tasksCompleted,
      tasksPartiallyCompleted: todayEval.tasksPartiallyCompleted,
      tasksRescheduled: todayEval.tasksRescheduled,
      tasksMissed: todayEval.tasksMissed,
      tasksCancelled: todayEval.tasksCancelled,
      totalPlanned: todayEval.totalPlanned,
      effectivePlanned: todayEval.effectivePlanned,
    };

    const stats =
      (await dailyStatsRepository.upsert(
        userId,
        todayProductDate,
        todayStatPayload
      )) || {};

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
      completedCount: todayEval.completedCommitments,
      tasksPlanned: todayEval.tasksTotalPlanned,
      tasksCompleted: todayEval.tasksCompleted,
      tasksEffectivePlanned: todayEval.tasksEffectivePlanned,
      routinesPlanned: todayEval.routinesTotalPlanned,
      routinesCompleted: todayEval.routinesCompleted,
      routinesSkipped: todayEval.routinesSkipped,
      routinesMissed: todayEval.routinesMissed,
      routinesEffectivePlanned: todayEval.routinesEffectivePlanned,
      partialCount: todayEval.tasksPartiallyCompleted,
      rescheduledCount: todayEval.tasksRescheduled,
      missedCount: todayEval.tasksMissed + todayEval.routinesMissed,
      cancelledCount: todayEval.tasksCancelled,
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

    const [statsList, routineOccs] = await Promise.all([
      dailyStatsRepository.findByUserAndDateRange(userId, startPDate, endPDate).catch(() => []),
      routineOccurrenceRepository.findByUserAndDateRange(userId, startPDate, endPDate).catch(() => []),
    ]);

    const routinesByDate = new Map();
    for (const r of routineOccs) {
      const pDate =
        r.productDate ||
        (r.date instanceof Date
          ? r.date.toISOString().slice(0, 10)
          : String(r.date).slice(0, 10));
      if (!routinesByDate.has(pDate)) routinesByDate.set(pDate, []);
      routinesByDate.get(pDate).push(r);
    }

    return statsList.map((stat) => {
      const dayRoutines = (routinesByDate.get(stat.productDate) || []).filter(
        (r) => r.routineStatus !== "archived" && r.status !== "archived"
      );
      const routinesPlanned = dayRoutines.length;
      const routinesCompleted = dayRoutines.filter((r) => r.status === "completed").length;
      const routinesSkipped = dayRoutines.filter((r) => r.status === "skipped").length;
      const routinesMissed = dayRoutines.filter((r) => r.status === "missed").length;

      return {
        ...stat,
        tasksPlanned: Math.max(0, (stat.totalPlanned ?? 0) - routinesPlanned),
        tasksEffectivePlanned: Math.max(
          0,
          (stat.effectivePlanned ?? 0) - (routinesPlanned - routinesSkipped)
        ),
        routinesPlanned,
        routinesCompleted,
        routinesSkipped,
        routinesMissed,
        commitmentsPlanned: stat.totalPlanned ?? 0,
        commitmentsEffective: stat.effectivePlanned ?? 0,
        commitmentsCompleted: (stat.tasksCompleted ?? 0) + routinesCompleted,
      };
    });
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
