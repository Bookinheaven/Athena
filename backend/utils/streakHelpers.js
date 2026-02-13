import streakModel from "../models/streakModel.js";

export async function getRecentStreakDays(userId, days = 7) {
  return streakModel.find({ userId })
    .sort({ date: -1 })
    .limit(days);
}
