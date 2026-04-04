import streakModel from "../models/dailyStatsModel.js";

export async function getRecentStreakDays(userId, days = 7) {
  return streakModel.find({ userId })
    .sort({ date: -1 })
    .limit(days);
}
export const isSameDay = (d1, d2) =>
  d1 && d2 && getStartOfDay(d1).getTime() === getStartOfDay(d2).getTime();

export function getStartOfDay(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0
  ));
}