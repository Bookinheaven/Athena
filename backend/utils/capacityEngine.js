/**
 * capacityEngine.js
 *
 * Pure, deterministic computation engine for Athena's Adaptive Intelligence Layer:
 * - Rolling Capacity (C14): 14-day median of daily focus minutes excluding neutral days.
 * - Planning Overload Ratio (O_day): scheduled minutes / C14.
 * - Decision Rule: Emits advisory overload intent when O_day > 1.30.
 *
 * Design constraints:
 * - 100% deterministic mathematical calculations.
 * - Zero machine learning / zero LLM dependencies.
 * - No psychological or diagnostic copy; strictly factual, observed telemetry numbers.
 */

export const MIN_ACTIVE_DAYS_REQUIRED = 5;
export const OVERLOAD_THRESHOLD = 1.30;
export const CAPACITY_WINDOW_DAYS = 14;

/**
 * Format minutes into clean human-readable duration strings (e.g. "4h 30m", "2h", "45m").
 *
 * @param {number|null|undefined} minutes
 * @returns {string}
 */
export function formatMinutesHuman(minutes) {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return "0m";
  const mins = Math.max(0, Math.round(minutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (h === 0 && m === 0) return "0m";
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Calculates the calendar date window of length `daysBack` strictly prior to `targetProductDate`.
 *
 * @param {string} targetProductDate "YYYY-MM-DD"
 * @param {number} [daysBack=14]
 * @returns {{ windowStart: string, windowEnd: string }}
 */
export function getPrecedingDateWindow(targetProductDate, daysBack = CAPACITY_WINDOW_DAYS) {
  if (!targetProductDate || typeof targetProductDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(targetProductDate)) {
    throw new Error("Invalid targetProductDate. Expected YYYY-MM-DD format.");
  }

  const [y, m, d] = targetProductDate.split("-").map(Number);

  // Day -1 (yesterday)
  const endUtc = new Date(Date.UTC(y, m - 1, d - 1));
  // Day -daysBack (14 days prior)
  const startUtc = new Date(Date.UTC(y, m - 1, d - daysBack));

  return {
    windowStart: startUtc.toISOString().slice(0, 10),
    windowEnd: endUtc.toISOString().slice(0, 10),
  };
}

/**
 * Computes Rolling Capacity C14:
 * The median of daily completed focus minutes over the previous 14 product days,
 * excluding neutral days.
 *
 * @param {Array<object>} dailyStatsList Array of daily_stats domain objects
 * @param {string} targetProductDate Canonical product date "YYYY-MM-DD"
 * @param {object} [options]
 * @param {number} [options.minActiveDays=5]
 * @returns {{
 *   capacityMinutes: number | null,
 *   activeDaysCount: number,
 *   hasSufficientData: boolean,
 *   windowStart: string,
 *   windowEnd: string,
 *   activeDaysValues: Array<number>
 * }}
 */
export function calculateRollingCapacity(dailyStatsList = [], targetProductDate, options = {}) {
  const minActiveDays = options.minActiveDays ?? MIN_ACTIVE_DAYS_REQUIRED;
  const { windowStart, windowEnd } = getPrecedingDateWindow(targetProductDate, CAPACITY_WINDOW_DAYS);

  // Filter stats strictly within the 14-day preceding window
  const windowStats = dailyStatsList.filter((stat) => {
    const pDate = stat.productDate || stat.date;
    if (!pDate) return false;
    const dateStr = typeof pDate === "string" ? pDate.slice(0, 10) : pDate.toISOString().slice(0, 10);
    return dateStr >= windowStart && dateStr <= windowEnd;
  });

  // Exclude neutral days:
  // In Athena, state === 'neutral' denotes days with zero effective planned work (rest/inactive days).
  const nonNeutralStats = windowStats.filter((stat) => {
    const isNeutralState = stat.state === "neutral";
    const hasZeroPlannedAndZeroFocus = (stat.effectivePlanned === 0 || stat.totalPlanned === 0) && (stat.focusMinutes === 0 || !stat.focusMinutes);
    return !isNeutralState && !hasZeroPlannedAndZeroFocus;
  });

  const activeDaysCount = nonNeutralStats.length;

  if (activeDaysCount < minActiveDays) {
    return {
      capacityMinutes: null,
      activeDaysCount,
      hasSufficientData: false,
      windowStart,
      windowEnd,
      activeDaysValues: [],
    };
  }

  // Extract non-negative focus minutes and sort ascending
  const sortedMinutes = nonNeutralStats
    .map((s) => Math.max(0, Number(s.focusMinutes || 0)))
    .sort((a, b) => a - b);

  // Compute median
  const n = sortedMinutes.length;
  let medianMinutes;
  if (n % 2 === 1) {
    medianMinutes = sortedMinutes[Math.floor(n / 2)];
  } else {
    medianMinutes = Math.round((sortedMinutes[n / 2 - 1] + sortedMinutes[n / 2]) / 2);
  }

  return {
    capacityMinutes: medianMinutes,
    activeDaysCount,
    hasSufficientData: true,
    windowStart,
    windowEnd,
    activeDaysValues: sortedMinutes,
  };
}

/**
 * Calculates Planning Overload Ratio (O_day = scheduledMinutes / C14)
 * and evaluates the adaptation decision rule: O_day > 1.30.
 *
 * @param {number} scheduledMinutes Sum of scheduled block durations for the day
 * @param {object} capacityResult Output from calculateRollingCapacity
 * @param {string} targetProductDate "YYYY-MM-DD"
 * @param {object} [options]
 * @param {number} [options.threshold=1.30]
 * @returns {{
 *   targetProductDate: string,
 *   scheduledMinutes: number,
 *   rollingCapacityMinutes: number | null,
 *   overloadRatio: number | null,
 *   threshold: number,
 *   status: "insufficient_data" | "overloaded" | "realistic",
 *   isOverloaded: boolean,
 *   activeDaysCount: number,
 *   summary: string,
 *   explanation: string,
 *   formattedScheduled: string,
 *   formattedCapacity: string | null
 * }}
 */
export function calculatePlanningOverload(
  scheduledMinutes = 0,
  capacityResult,
  targetProductDate,
  options = {}
) {
  const threshold = options.threshold ?? OVERLOAD_THRESHOLD;
  const effectiveScheduled = Math.max(0, Math.round(scheduledMinutes || 0));
  const formattedScheduled = formatMinutesHuman(effectiveScheduled);

  // 1. Data Quality Gate: Insufficient history
  if (!capacityResult || !capacityResult.hasSufficientData || capacityResult.capacityMinutes === null) {
    return {
      targetProductDate,
      scheduledMinutes: effectiveScheduled,
      rollingCapacityMinutes: null,
      overloadRatio: null,
      threshold,
      status: "insufficient_data",
      isOverloaded: false,
      activeDaysCount: capacityResult?.activeDaysCount ?? 0,
      summary: "Establishing capacity baseline",
      explanation: `Complete at least ${options.minActiveDays ?? MIN_ACTIVE_DAYS_REQUIRED} active days of focus to establish your typical capacity baseline.`,
      formattedScheduled,
      formattedCapacity: null,
    };
  }

  const capacity = capacityResult.capacityMinutes;
  const formattedCapacity = formatMinutesHuman(capacity);

  // 2. Handle Zero Capacity Edge Case (Median focus = 0m)
  if (capacity === 0) {
    if (effectiveScheduled === 0) {
      return {
        targetProductDate,
        scheduledMinutes: 0,
        rollingCapacityMinutes: 0,
        overloadRatio: 0,
        threshold,
        status: "realistic",
        isOverloaded: false,
        activeDaysCount: capacityResult.activeDaysCount,
        summary: "Plan looks realistic",
        explanation: "No focus scheduled for this date.",
        formattedScheduled,
        formattedCapacity,
      };
    }

    // Scheduled > 0 with 0 median capacity
    return {
      targetProductDate,
      scheduledMinutes: effectiveScheduled,
      rollingCapacityMinutes: 0,
      overloadRatio: Infinity,
      threshold,
      status: "overloaded",
      isOverloaded: true,
      activeDaysCount: capacityResult.activeDaysCount,
      summary: "Your plan is heavier than usual",
      explanation: `You've scheduled ${formattedScheduled} of focus, compared with your recent median of ${formattedCapacity}.`,
      formattedScheduled,
      formattedCapacity,
    };
  }

  // 3. Normal Ratio Calculation
  const overloadRatio = Number((effectiveScheduled / capacity).toFixed(2));
  // Strict inequality check as per architecture specification: O_day > 1.30
  const isOverloaded = overloadRatio > threshold;

  if (isOverloaded) {
    return {
      targetProductDate,
      scheduledMinutes: effectiveScheduled,
      rollingCapacityMinutes: capacity,
      overloadRatio,
      threshold,
      status: "overloaded",
      isOverloaded: true,
      activeDaysCount: capacityResult.activeDaysCount,
      summary: "Your plan is heavier than usual",
      explanation: `You've scheduled ${formattedScheduled} of focus, compared with your recent median of ${formattedCapacity}.`,
      formattedScheduled,
      formattedCapacity,
    };
  }

  return {
    targetProductDate,
    scheduledMinutes: effectiveScheduled,
    rollingCapacityMinutes: capacity,
    overloadRatio,
    threshold,
    status: "realistic",
    isOverloaded: false,
    activeDaysCount: capacityResult.activeDaysCount,
    summary: "Plan looks realistic",
    explanation: `You've scheduled ${formattedScheduled} of focus, within your recent median capacity of ${formattedCapacity}.`,
    formattedScheduled,
    formattedCapacity,
  };
}
