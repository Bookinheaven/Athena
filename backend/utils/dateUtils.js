/**
 * dateUtils.js
 *
 * Centralized date utility foundation for user product-day calculations,
 * occurrence date normalization, timezone resolution, and historical range queries.
 *
 * Canonical representation:
 * - Product Date: String "YYYY-MM-DD" representing the calendar day in user's IANA timezone.
 * - Normalized Day Date: Date object at UTC midnight corresponding to that calendar day.
 */

import User from "../models/userModel.js";

/**
 * Validate whether a string is a valid IANA timezone identifier.
 *
 * @param {string} timezone
 * @returns {boolean}
 */
export function isValidTimezone(timezone) {
  if (!timezone || typeof timezone !== "string") return false;
  const trimmed = timezone.trim();
  // Reject numeric offsets (e.g. "+05:30", "-04:00", "+0530", "+5")
  if (/^[+-]\d{1,2}(:?\d{2})?$/.test(trimmed)) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Normalize an IANA timezone string or fallback to "UTC".
 *
 * @param {string} [timezone]
 * @returns {string} Valid IANA timezone
 */
export function normalizeTimezone(timezone) {
  if (isValidTimezone(timezone)) {
    return timezone.trim();
  }
  return "UTC";
}

/**
 * Extract timezone identifier from a user document or object.
 *
 * @param {object} [user]
 * @returns {string} IANA timezone string or "UTC"
 */
export function getUserTimezone(user) {
  const candidate =
    user?.settings?.timezone ||
    user?.timezone ||
    user?.preferences?.timezone;
  return normalizeTimezone(candidate);
}

/**
 * Resolves user timezone from a User instance, document, or ID.
 *
 * @param {string | mongoose.Types.ObjectId | object} [userOrId]
 * @param {string} [fallbackTimezone="UTC"]
 * @returns {Promise<string>}
 */
export async function resolveUserTimezone(userOrId, fallbackTimezone = "UTC") {
  if (!userOrId) return normalizeTimezone(fallbackTimezone);

  if (typeof userOrId === "object" && userOrId !== null) {
    const tz = getUserTimezone(userOrId);
    if (isValidTimezone(tz)) return tz;
    if (userOrId._id) {
      userOrId = userOrId._id;
    } else {
      return normalizeTimezone(fallbackTimezone);
    }
  }

  try {
    const user = await User.findById(userOrId).select("settings.timezone").lean();
    const tz = user?.settings?.timezone;
    if (isValidTimezone(tz)) return tz;
  } catch (err) {
    // ignore lookup error, fall through to fallback
  }

  return normalizeTimezone(fallbackTimezone);
}

/**
 * Returns canonical product date string "YYYY-MM-DD" for a date/instant in a given timezone.
 *
 * @param {Date | string | number} [date=new Date()]
 * @param {string} [timezone="UTC"]
 * @returns {string} "YYYY-MM-DD"
 */
export function getProductDate(date = new Date(), timezone = "UTC") {
  if (!date) return getProductDate(new Date(), timezone);

  // If already a strict YYYY-MM-DD string, return it directly
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date provided to getProductDate");
  }

  const tz = normalizeTimezone(timezone);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

/**
 * Returns the exact millisecond offset of an instant in a timezone relative to UTC.
 *
 * @param {Date} instant
 * @param {string} timezone
 * @returns {number} Offset in ms
 */
function getTzOffsetMs(instant, timezone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false,
  });
  const parts = formatter.formatToParts(instant);
  const m = {};
  for (const p of parts) m[p.type] = p.value;
  const tzAsUTC = Date.UTC(
    parseInt(m.year, 10),
    parseInt(m.month, 10) - 1,
    parseInt(m.day, 10),
    m.hour === "24" ? 0 : parseInt(m.hour, 10),
    parseInt(m.minute, 10),
    parseInt(m.second, 10),
    parseInt(m.fractionalSecond || 0, 10)
  );
  return tzAsUTC - instant.getTime();
}

/**
 * Returns the UTC Date object corresponding to the start of the product day (00:00:00.000) in that timezone.
 *
 * @param {string | Date} productDate "YYYY-MM-DD" or Date
 * @param {string} [timezone="UTC"]
 * @returns {Date}
 */
export function productDateToStart(productDate, timezone = "UTC") {
  const tz = normalizeTimezone(timezone);
  const pDate = getProductDate(productDate, tz);
  const [y, m, d] = pDate.split("-").map(Number);
  const targetUtcMidnight = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  const initialOffset = getTzOffsetMs(new Date(targetUtcMidnight), tz);
  let utcTime = targetUtcMidnight - initialOffset;
  const verifiedOffset = getTzOffsetMs(new Date(utcTime), tz);
  if (verifiedOffset !== initialOffset) {
    utcTime = targetUtcMidnight - verifiedOffset;
  }
  return new Date(utcTime);
}

/**
 * Returns the UTC Date object corresponding to the end of the product day (23:59:59.999) in that timezone.
 *
 * @param {string | Date} productDate "YYYY-MM-DD" or Date
 * @param {string} [timezone="UTC"]
 * @returns {Date}
 */
export function productDateToEnd(productDate, timezone = "UTC") {
  const tz = normalizeTimezone(timezone);
  const pDate = getProductDate(productDate, tz);
  const [y, m, d] = pDate.split("-").map(Number);
  const targetUtcEnd = Date.UTC(y, m - 1, d, 23, 59, 59, 999);
  const initialOffset = getTzOffsetMs(new Date(targetUtcEnd), tz);
  let utcTime = targetUtcEnd - initialOffset;
  const verifiedOffset = getTzOffsetMs(new Date(utcTime), tz);
  if (verifiedOffset !== initialOffset) {
    utcTime = targetUtcEnd - verifiedOffset;
  }
  return new Date(utcTime);
}

/**
 * Normalizes a date to a canonical UTC midnight Date object representing the calendar day in user's timezone.
 *
 * @param {Date | string | number} [date=new Date()]
 * @param {string} [timezone="UTC"]
 * @returns {Date} Canonical UTC midnight Date object
 */
export function toStartOfDayUTC(date = new Date(), timezone = "UTC") {
  const pDate = getProductDate(date, timezone);
  const [y, m, d] = pDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/**
 * Normalizes a date to end of product day in UTC midnight space.
 *
 * @param {Date | string | number} [date=new Date()]
 * @param {string} [timezone="UTC"]
 * @returns {Date}
 */
export function toEndOfDayUTC(date = new Date(), timezone = "UTC") {
  const pDate = getProductDate(date, timezone);
  const [y, m, d] = pDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

/**
 * Normalize an input date into a standardized user-day representation.
 *
 * @param {Date | string | number} date
 * @param {string} [timezone="UTC"]
 * @returns {Date}
 */
export function normalizeUserDate(date, timezone = "UTC") {
  return toStartOfDayUTC(date, timezone);
}

/**
 * Parse and validate a start/end date range in user's timezone.
 *
 * @param {string | Date} [startDate]
 * @param {string | Date} [endDate]
 * @param {string} [timezone="UTC"]
 * @returns {{ start: Date | null, end: Date | null, startProductDate: string | null, endProductDate: string | null }}
 */
export function parseDateRange(startDate, endDate, timezone = "UTC") {
  let start = null;
  let end = null;
  let startProductDate = null;
  let endProductDate = null;

  if (startDate) {
    startProductDate = getProductDate(startDate, timezone);
    start = toStartOfDayUTC(startProductDate, "UTC");
  }

  if (endDate) {
    endProductDate = getProductDate(endDate, timezone);
    end = toEndOfDayUTC(endProductDate, "UTC");
  }

  if (start && end && start.getTime() > end.getTime()) {
    throw new Error("startDate must be before or equal to endDate");
  }

  return { start, end, startProductDate, endProductDate };
}

/**
 * Checks whether two dates fall on the same product day in user's timezone.
 *
 * @param {Date | string} d1
 * @param {Date | string} d2
 * @param {string} [timezone="UTC"]
 * @returns {boolean}
 */
export function isSameDay(d1, d2, timezone = "UTC") {
  if (!d1 || !d2) return false;
  return getProductDate(d1, timezone) === getProductDate(d2, timezone);
}
