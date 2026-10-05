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

/**
 * Calculates day difference between two "YYYY-MM-DD" product date strings (date2 - date1).
 */
export function getDaysDifference(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return 0;
  const p1 = parseProductDate(dateStr1);
  const p2 = parseProductDate(dateStr2);
  const d1 = Date.UTC(p1.year, p1.month - 1, p1.day);
  const d2 = Date.UTC(p2.year, p2.month - 1, p2.day);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Derives comprehensive scheduling metadata and labels for a task following product date presentation rules.
 */
export function getTaskScheduleInfo(task, timezone) {
  const productDate = getTaskProductDate(task);
  if (!productDate) {
    return {
      productDate: null,
      type: "unscheduled",
      label: "No date",
      compactLabel: null,
      detailLabel: "Not scheduled",
      isToday: false,
      isTomorrow: false,
      isFuture: false,
      isOverdue: false,
    };
  }

  const tz = timezone || getUserTimezone();
  const today = getTodayProductDate(tz);
  const tomorrow = getTomorrowProductDate(tz);
  const diffDays = getDaysDifference(today, productDate);

  const { year, month, day } = parseProductDate(productDate);
  const localNoon = new Date(year, month - 1, day, 12, 0, 0);

  const monthDay = localNoon.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (diffDays === 0) {
    return {
      productDate,
      type: "today",
      label: "Today",
      compactLabel: "Today",
      detailLabel: `Today · ${monthDay}`,
      isToday: true,
      isTomorrow: false,
      isFuture: false,
      isOverdue: false,
    };
  }

  if (diffDays === 1) {
    return {
      productDate,
      type: "tomorrow",
      label: "Tomorrow",
      compactLabel: "Tomorrow",
      detailLabel: `Tomorrow · ${monthDay}`,
      isToday: false,
      isTomorrow: true,
      isFuture: true,
      isOverdue: false,
    };
  }

  if (diffDays > 1 && diffDays <= 6) {
    const weekdayMonthDay = localNoon.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return {
      productDate,
      type: "future_near",
      label: weekdayMonthDay,
      compactLabel: weekdayMonthDay,
      detailLabel: weekdayMonthDay,
      isToday: false,
      isTomorrow: false,
      isFuture: true,
      isOverdue: false,
    };
  }

  if (diffDays > 6) {
    const fullDate = localNoon.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const shortDate = localNoon.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return {
      productDate,
      type: "future_far",
      label: fullDate,
      compactLabel: shortDate,
      detailLabel: fullDate,
      isToday: false,
      isTomorrow: false,
      isFuture: true,
      isOverdue: false,
    };
  }

  // diffDays < 0 (Past date)
  const isCompleted = task?.status === "completed";
  const overdueLabel = isCompleted ? monthDay : `Overdue · ${monthDay}`;
  return {
    productDate,
    type: isCompleted ? "past_completed" : "overdue",
    label: overdueLabel,
    compactLabel: overdueLabel,
    detailLabel: overdueLabel,
    isToday: false,
    isTomorrow: false,
    isFuture: false,
    isOverdue: !isCompleted,
  };
}

/**
 * Returns user-facing confirmation copy after scheduling a task (e.g. "Task scheduled for Tomorrow").
 */
export function formatScheduleConfirmation(productDateStr, timezone) {
  if (!productDateStr) return "Task saved with no date";
  const tz = timezone || getUserTimezone();
  const info = getTaskScheduleInfo({ customPlannedDate: productDateStr }, tz);
  return `Task scheduled for ${info.label}`;
}

/**
 * Returns formatted Planner date header metadata including relative label ("Today", "Tomorrow").
 */
export function formatPlannerDateHeader(selectedDateStr, timezone) {
  if (!selectedDateStr) return { relative: null, calendar: "", combined: "" };
  const tz = timezone || getUserTimezone();
  const today = getTodayProductDate(tz);
  const tomorrow = getTomorrowProductDate(tz);
  const diffDays = getDaysDifference(today, selectedDateStr);

  const { year, month, day } = parseProductDate(selectedDateStr);
  const localNoon = new Date(year, month - 1, day, 12, 0, 0);

  const fullCalendar = localNoon.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let relative = null;
  if (diffDays === 0) relative = "Today";
  else if (diffDays === 1) relative = "Tomorrow";
  else if (diffDays === -1) relative = "Yesterday";

  return {
    relative,
    calendar: fullCalendar,
    combined: relative ? `${relative} · ${fullCalendar}` : fullCalendar,
    shortDay: localNoon.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

