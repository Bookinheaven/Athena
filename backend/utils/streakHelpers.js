import streakModel from "../models/dailyStatsModel.js";

export async function getRecentStreakDays(userId, days = 7) {
  return streakModel.find({ userId })
    .sort({ date: -1 })
    .limit(days);
}

export function getStartOfDay(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0
  ));
}