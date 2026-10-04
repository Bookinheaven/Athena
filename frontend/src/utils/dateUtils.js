/**
 * Centralized Date and Product-Day Utilities for Frontend.
 *
 * Ensures canonical product dates ("YYYY-MM-DD") are used consistently across
 * Today, Planner, TaskModal, and History without browser UTC serialization drift.
 */

export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch (e) {
    return "UTC";
  }
}

/**
 * Returns today's product date in user's timezone ("YYYY-MM-DD").
 */
export function getTodayProductDate(timezone) {
  const tz = timezone || getUserTimezone();
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch (e) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
}

/**
 * Returns tomorrow's product date in user's timezone ("YYYY-MM-DD").
 */
export function getTomorrowProductDate(timezone) {
  const tz = timezone || getUserTimezone();
  try {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d);
  } catch (e) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
}

/**
 * Construct "YYYY-MM-DD" from numeric parts.
 */
export function formatProductDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Parse "YYYY-MM-DD" into numeric { year, month, day }.
 */
export function parseProductDate(productDateStr) {
  if (!productDateStr || typeof productDateStr !== "string") {
    const today = getTodayProductDate();
    return parseProductDate(today);
  }
  const parts = productDateStr.split("-").map(Number);
  return {
    year: parts[0] || new Date().getFullYear(),
    month: parts[1] || new Date().getMonth() + 1,
    day: parts[2] || 1,
  };
}

/**
 * Human-readable format for header/details (e.g. "Wednesday, Oct 15, 2026").
 */
export function formatDisplayDate(productDateStr) {
  if (!productDateStr) return "";
  const { year, month, day } = parseProductDate(productDateStr);
  const localNoon = new Date(year, month - 1, day, 12, 0, 0);
  return localNoon.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Extract canonical "YYYY-MM-DD" product date from a task.
 * Respects customPlannedDate if present, or parses plannedDate ISO string without local timezone shift.
 */
export function getTaskProductDate(task) {
  if (!task) return null;
  if (task.customPlannedDate && typeof task.customPlannedDate === "string") {
    return task.customPlannedDate.split("T")[0];
  }
  if (!task.plannedDate) return null;
  if (typeof task.plannedDate === "string") {
    return task.plannedDate.split("T")[0];
  }
  if (task.plannedDate instanceof Date) {
    return task.plannedDate.toISOString().split("T")[0];
  }
  return null;
}

/**
 * Checks if a task is planned for a specific product date ("YYYY-MM-DD").
 */
export function isTaskPlannedForDate(task, targetProductDate) {
  const taskDate = getTaskProductDate(task);
  if (!taskDate || !targetProductDate) return false;
  return taskDate === targetProductDate;
}

/**
 * Checks if a task is planned for today in user's timezone.
 */
export function isTaskPlannedForToday(task, timezone) {
  const today = getTodayProductDate(timezone);
  return isTaskPlannedForDate(task, today);
}
