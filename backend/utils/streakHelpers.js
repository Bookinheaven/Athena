import DailyStats from "../models/dailyStatsModel.js";
import { toStartOfDayUTC, isSameDay } from "./dateUtils.js";

export async function getRecentStreakDays(userId, days = 7) {
  return DailyStats.find({ userId })
    .sort({ date: -1 })
    .limit(days);
}

export { isSameDay };

export function getStartOfDay(date = new Date()) {
  return toStartOfDayUTC(date);
}