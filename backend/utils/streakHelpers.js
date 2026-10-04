import dailyStatsRepository from "../repositories/dailyStatsRepository.js";
import { toStartOfDayUTC, isSameDay } from "./dateUtils.js";

export async function getRecentStreakDays(userId, days = 7) {
  return dailyStatsRepository.getRecentDays(userId, days);
}

export { isSameDay };

export function getStartOfDay(date = new Date()) {
  return toStartOfDayUTC(date);
}