/**
 * Date and calendar utilities for History V2.
 * Strictly operates on canonical product dates ("YYYY-MM-DD")
 * without browser UTC serialization drift.
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
 * Month and year title (e.g. "October 2026").
 */
export function formatMonthYear(year, month) {
  const localNoon = new Date(year, month - 1, 15, 12, 0, 0);
  return localNoon.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Navigate month with delta (-1 or +1).
 */
export function navigateMonth(year, month, delta) {
  let nextMonth = month + delta;
  let nextYear = year;
  if (nextMonth < 1) {
    nextMonth = 12;
    nextYear -= 1;
  } else if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  return { year: nextYear, month: nextMonth };
}

/**
 * Generates calendar grid cells for Monday-first week.
 */
export function getMonthGrid(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sun, 1 is Mon...
  // Convert Sunday-first (0-6) to Monday-first (0-6, where Mon=0, Sun=6)
  const mondayOffset = (firstDayOfWeek + 6) % 7;

  const days = [];

  // Previous month padding
  if (mondayOffset > 0) {
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    const prevNav = navigateMonth(year, month, -1);
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      days.push({
        day: d,
        year: prevNav.year,
        month: prevNav.month,
        productDate: formatProductDate(prevNav.year, prevNav.month, d),
        isCurrentMonth: false,
      });
    }
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      year,
      month,
      productDate: formatProductDate(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill out to multiple of 7
  const remainder = days.length % 7;
  if (remainder > 0) {
    const nextPadding = 7 - remainder;
    const nextNav = navigateMonth(year, month, 1);
    for (let d = 1; d <= nextPadding; d++) {
      days.push({
        day: d,
        year: nextNav.year,
        month: nextNav.month,
        productDate: formatProductDate(nextNav.year, nextNav.month, d),
        isCurrentMonth: false,
      });
    }
  }

  return days;
}

export function formatDuration(seconds) {
  if (isNaN(seconds) || seconds <= 0) return "0m";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatTimeRange(startStr, endStr) {
  if (!startStr) return null;
  return endStr ? `${startStr} – ${endStr}` : startStr;
}

export function formatTimeOnly(dateInput) {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}
