export const TARGET_WINDOW_DAYS = 7;
export const MIN_ACTIVE_DAYS_REQUIRED = 5;
export const TARGET_STEP_MINUTES = 5;
export const DEFAULT_MIN_TARGET = 20;
export const DEFAULT_MAX_TARGET = 90;
export const DEFAULT_DAILY_TARGET = 25;

/**
 * Calculates the calendar date window of length `daysBack` strictly prior to `targetProductDate`.
 *
 * @param {string} targetProductDate "YYYY-MM-DD"
 * @param {number} [daysBack=7]
 * @returns {{ windowStart: string, windowEnd: string }}
 */
export function getPrecedingDateWindow(targetProductDate, daysBack = TARGET_WINDOW_DAYS) {
  if (!targetProductDate || typeof targetProductDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(targetProductDate)) {
    throw new Error("Invalid targetProductDate. Expected YYYY-MM-DD format.");
  }

  const [y, m, d] = targetProductDate.split("-").map(Number);
  const endUtc = new Date(Date.UTC(y, m - 1, d - 1));
  const startUtc = new Date(Date.UTC(y, m - 1, d - daysBack));

  return {
    windowStart: startUtc.toISOString().slice(0, 10),
    windowEnd: endUtc.toISOString().slice(0, 10),
  };
}

/**
 * Determines whether a DailyStats record represents an active (non-neutral) day.
 *
 * @param {object} stat
 * @returns {boolean}
 */
export function isActiveDay(stat) {
  if (!stat) return false;
  const isNeutralState = stat.state === "neutral";
  const hasZeroPlanned = (stat.effectivePlanned ?? 0) === 0 && (stat.totalPlanned ?? 0) === 0;
  const hasZeroFocus = (stat.focusMinutes ?? 0) === 0;

  if (isNeutralState && hasZeroPlanned && hasZeroFocus) {
    return false;
  }
  return true;
}

/**
 * Determines whether an active day was successful relative to the daily focus target.
 *
 * @param {object} stat
 * @param {number} fallbackTarget
 * @returns {boolean}
 */
export function isDaySuccessful(stat, fallbackTarget) {
  if (!stat || !isActiveDay(stat)) return false;
  const target = stat.dailyTargetMinutes || fallbackTarget;
  const focus = Number(stat.focusMinutes ?? 0);
  const state = stat.state || "neutral";
  const freezes = Number(stat.usedFreeze ?? 0);

  // A day is successful if:
  // 1. Focus reached or exceeded daily target (or task state was green)
  // 2. State is not red (not abandoned/0% completion)
  // 3. No freeze was consumed on this day
  const achievedFocus = focus >= target;
  const nonRedState = state !== "red";
  const noFreeze = freezes === 0;

  return achievedFocus && nonRedState && noFreeze;
}

/**
 * Determines whether an active day represents repeated underperformance / fatigue.
 *
 * @param {object} stat
 * @param {number} fallbackTarget
 * @returns {boolean}
 */
export function isDayUnderperforming(stat, fallbackTarget) {
  if (!stat || !isActiveDay(stat)) return false;
  const target = stat.dailyTargetMinutes || fallbackTarget;
  const focus = Number(stat.focusMinutes ?? 0);
  const state = stat.state || "neutral";
  const freezes = Number(stat.usedFreeze ?? 0);

  // Underperforming if:
  // 1. Day failed completely (state === 'red'), OR
  // 2. Freeze was required to prevent streak loss (usedFreeze > 0), OR
  // 3. Focus minutes fell significantly below target (< 80% of target)
  return state === "red" || freezes > 0 || focus < 0.8 * target;
}

/**
 * Computes descriptive statistics for a list of daily focus minutes.
 *
 * @param {Array<number>} values
 * @returns {{ median: number, average: number }}
 */
export function computeFocusStatistics(values = []) {
  if (!values.length) return { median: 0, average: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const average = Math.round(sum / sorted.length);

  const n = sorted.length;
  let median;
  if (n % 2 === 1) {
    median = sorted[Math.floor(n / 2)];
  } else {
    median = Math.round((sorted[n / 2 - 1] + sorted[n / 2]) / 2);
  }

  return { median, average };
}

/**
 * Pure decision engine for Athena's Adaptive Daily Focus Target.
 *
 * @param {Array<object>} dailyStatsList Historical daily stats
 * @param {string} targetProductDate Canonical product date "YYYY-MM-DD" being planned/evaluated
 * @param {object} [config]
 * @param {number} [config.currentTargetMinutes=25]
 * @param {number} [config.minTargetMinutes=20]
 * @param {number} [config.maxTargetMinutes=90]
 * @param {number} [config.windowDays=7]
 * @param {number} [config.minActiveDays=5]
 * @param {number} [config.stepMinutes=5]
 * @returns {{
 *   status: "recommended" | "stable" | "insufficient_data",
 *   currentTargetMinutes: number,
 *   proposedTargetMinutes: number,
 *   direction: "increase" | "decrease" | "none",
 *   reason: "increase_consistency" | "decrease_burnout" | "maintain_consistency" | "at_maximum_bound" | "at_minimum_bound" | "insufficient_data",
 *   evidence: {
 *     targetProductDate: string,
 *     windowStart: string,
 *     windowEnd: string,
 *     activeDaysCount: number,
 *     successfulDaysCount: number,
 *     underperformingDaysCount: number,
 *     freezesUsedCount: number,
 *     medianFocusMinutes: number,
 *     averageFocusMinutes: number,
 *     consecutiveSuccessCount: number,
 *     minTargetMinutes: number,
 *     maxTargetMinutes: number
 *   },
 *   confidence: number
 * }}
 */
export function calculateAdaptiveTarget(
  dailyStatsList = [],
  targetProductDate,
  config = {}
) {
  const currentTarget = Math.round(Number(config.currentTargetMinutes) || DEFAULT_DAILY_TARGET);
  const minTarget = Math.round(Number(config.minTargetMinutes) || DEFAULT_MIN_TARGET);
  const maxTarget = Math.round(Number(config.maxTargetMinutes) || DEFAULT_MAX_TARGET);
  const windowDays = Number(config.windowDays) || TARGET_WINDOW_DAYS;
  const minActiveDays = Number(config.minActiveDays) || MIN_ACTIVE_DAYS_REQUIRED;
  const stepMinutes = Number(config.stepMinutes) || TARGET_STEP_MINUTES;

  const { windowStart, windowEnd } = getPrecedingDateWindow(targetProductDate, windowDays);

  // 1. Filter stats strictly within the 7-day preceding window
  const windowStats = dailyStatsList.filter((stat) => {
    const pDate = stat.productDate || stat.date;
    if (!pDate) return false;
    const dateStr = typeof pDate === "string" ? pDate.slice(0, 10) : pDate.toISOString().slice(0, 10);
    return dateStr >= windowStart && dateStr <= windowEnd;
  });

  // Sort chronologically ascending
  windowStats.sort((a, b) => {
    const da = a.productDate || a.date;
    const db = b.productDate || b.date;
    return String(da).localeCompare(String(db));
  });

  // 2. Filter active (non-neutral) days
  const activeStats = windowStats.filter(isActiveDay);
  const activeDaysCount = activeStats.length;

  // Extract focus minutes and stats
  const activeMinutes = activeStats.map((s) => Math.max(0, Number(s.focusMinutes || 0)));
  const { median: medianFocusMinutes, average: averageFocusMinutes } = computeFocusStatistics(activeMinutes);

  const successfulDaysCount = activeStats.filter((s) => isDaySuccessful(s, currentTarget)).length;
  const underperformingDaysCount = activeStats.filter((s) => isDayUnderperforming(s, currentTarget)).length;
  const freezesUsedCount = activeStats.reduce((sum, s) => sum + Number(s.usedFreeze || 0), 0);

  // Count consecutive successful active days working backward from most recent active day
  let consecutiveSuccessCount = 0;
  for (let i = activeStats.length - 1; i >= 0; i--) {
    if (isDaySuccessful(activeStats[i], currentTarget)) {
      consecutiveSuccessCount++;
    } else {
      break;
    }
  }

  const baseEvidence = {
    targetProductDate,
    windowStart,
    windowEnd,
    activeDaysCount,
    successfulDaysCount,
    underperformingDaysCount,
    freezesUsedCount,
    medianFocusMinutes,
    averageFocusMinutes,
    consecutiveSuccessCount,
    minTargetMinutes: minTarget,
    maxTargetMinutes: maxTarget,
  };

  // 3. Minimum Confidence Gate: Insufficient history
  if (activeDaysCount < minActiveDays) {
    const confidence = Number((activeDaysCount / minActiveDays).toFixed(2));
    return {
      status: "insufficient_data",
      currentTargetMinutes: currentTarget,
      proposedTargetMinutes: currentTarget,
      direction: "none",
      reason: "insufficient_data",
      evidence: baseEvidence,
      confidence,
    };
  }

  const confidence = Number(Math.min(1.0, activeDaysCount / windowDays).toFixed(2));

  // 4. Decision Rule: Increase Trigger
  // Conditions:
  // - >= 5 evaluated active days
  // - Either: past 5 consecutive active days achieved target OR >= 5 successful days with 0 underperformance
  // - Zero freezes consumed in the window
  const qualifiesForIncrease =
    consecutiveSuccessCount >= 5 && freezesUsedCount === 0;

  if (qualifiesForIncrease) {
    if (currentTarget >= maxTarget) {
      return {
        status: "stable",
        currentTargetMinutes: currentTarget,
        proposedTargetMinutes: maxTarget,
        direction: "none",
        reason: "at_maximum_bound",
        evidence: baseEvidence,
        confidence,
      };
    }

    const proposed = Math.min(currentTarget + stepMinutes, maxTarget);
    return {
      status: "recommended",
      currentTargetMinutes: currentTarget,
      proposedTargetMinutes: proposed,
      direction: "increase",
      reason: "increase_consistency",
      evidence: baseEvidence,
      confidence,
    };
  }

  // 5. Decision Rule: Decrease Trigger
  // Conditions:
  // - Repeated underperformance: >= 2 underperforming days OR >= 2 freezes used in past 7 days
  // - Note: A single bad day NEVER reduces the target (requires at least 2)
  const qualifiesForDecrease =
    underperformingDaysCount >= 2 || freezesUsedCount >= 2;

  if (qualifiesForDecrease) {
    if (currentTarget <= minTarget) {
      return {
        status: "stable",
        currentTargetMinutes: currentTarget,
        proposedTargetMinutes: minTarget,
        direction: "none",
        reason: "at_minimum_bound",
        evidence: baseEvidence,
        confidence,
      };
    }

    const proposed = Math.max(currentTarget - stepMinutes, minTarget);
    return {
      status: "recommended",
      currentTargetMinutes: currentTarget,
      proposedTargetMinutes: proposed,
      direction: "decrease",
      reason: "decrease_burnout",
      evidence: baseEvidence,
      confidence,
    };
  }

  // 6. Default: Maintain Consistency
  return {
    status: "stable",
    currentTargetMinutes: currentTarget,
    proposedTargetMinutes: currentTarget,
    direction: "none",
    reason: "maintain_consistency",
    evidence: baseEvidence,
    confidence,
  };
}

/**
 * Formats a structured target decision into non-judgmental, explainable prose.
 *
 * @param {object} decision Output of calculateAdaptiveTarget
 * @returns {{ summary: string, explanation: string, badgeText: string }}
 */
export function formatTargetRecommendation(decision) {
  if (!decision) {
    return {
      summary: "Daily target active",
      explanation: "Your daily focus commitment is active.",
      badgeText: "Active",
    };
  }

  const {
    status,
    direction,
    reason,
    currentTargetMinutes,
    proposedTargetMinutes,
    evidence = {},
  } = decision;

  const {
    activeDaysCount = 0,
    successfulDaysCount = 0,
    medianFocusMinutes = 0,
    freezesUsedCount = 0,
    minTargetMinutes = DEFAULT_MIN_TARGET,
    maxTargetMinutes = DEFAULT_MAX_TARGET,
  } = evidence;

  if (status === "insufficient_data") {
    return {
      summary: "Establishing focus baseline",
      explanation: `Complete at least ${MIN_ACTIVE_DAYS_REQUIRED} active days of focus to enable adaptive target recommendations. (${activeDaysCount}/${MIN_ACTIVE_DAYS_REQUIRED} days recorded)`,
      badgeText: "Baseline",
    };
  }

  if (reason === "at_maximum_bound") {
    return {
      summary: `Target at maximum limit (${maxTargetMinutes}m)`,
      explanation: `You've sustained consistent execution. Your daily focus target is capped at your configured maximum of ${maxTargetMinutes}m.`,
      badgeText: "Max Limit",
    };
  }

  if (reason === "at_minimum_bound") {
    return {
      summary: `Target at minimum limit (${minTargetMinutes}m)`,
      explanation: `Your daily target is currently at your configured floor of ${minTargetMinutes}m to protect baseline momentum.`,
      badgeText: "Min Limit",
    };
  }

  if (direction === "increase") {
    return {
      summary: `Your recent focus pattern supports a ${proposedTargetMinutes}-minute target`,
      explanation: `Based on ${successfulDaysCount} successful days out of ${activeDaysCount} active days (median ${medianFocusMinutes}m), we recommend stepping your target from ${currentTargetMinutes}m to ${proposedTargetMinutes}m to build stamina.`,
      badgeText: `+${TARGET_STEP_MINUTES}m Recommendation`,
    };
  }

  if (direction === "decrease") {
    const stressDetail =
      freezesUsedCount > 0
        ? `${freezesUsedCount} freeze days logged`
        : "multiple demanding days";
    return {
      summary: `Recommended target adjustment to ${proposedTargetMinutes}m`,
      explanation: `With ${stressDetail} in the past week, dialing your daily target from ${currentTargetMinutes}m to ${proposedTargetMinutes}m helps maintain your streak sustainably.`,
      badgeText: `-${TARGET_STEP_MINUTES}m Recommendation`,
    };
  }

  return {
    summary: `Target calibrated at ${currentTargetMinutes}m`,
    explanation: `Your recent focus pace (${activeDaysCount} active days, median ${medianFocusMinutes}m) aligns well with your current ${currentTargetMinutes}m target.`,
    badgeText: "Stable",
  };
}
