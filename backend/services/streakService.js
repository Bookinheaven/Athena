import Streak from "../models/streakModel.js";
import DailyStats from "../models/dailyStatsModel.js";
import { getStartOfDay } from "../utils/streakHelpers.js";
import dailyStatsModel from "../models/dailyStatsModel.js";

export async function processDailyStreak(userId) {
  const today = getStartOfDay();

  const streak = await Streak.findOne({ userId });

  if (!streak) throw new Error("Streak not found");

  const stats = await DailyStats.findOne({ userId, date: today });

  const focusMinutes = stats?.focusMinutes || 0;

  const target = Math.max(streak.dailyTargetMinutes, 1);

  const streakRate = focusMinutes / target;

  let state = "red";

  if (streakRate >= 1) state = "green";
  else if (streakRate >= 0.7) state = "yellow";

  const lastDate = streak.lastProcessedDate
    ? getStartOfDay(streak.lastProcessedDate)
    : null;

  const previousStreak = streak.dailyStreak;

  let freezeUsed = 0;

  if (!lastDate) {
    streak.dailyStreak = state === "green" ? 1 : 0;
  } else {
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      if (state === "green") {
        streak.dailyStreak = previousStreak + 1;

        if (
          streak.dailyStreak % 7 === 0 &&
          streak.freezeBalance < streak.maxFreezeBalance
        ) {
          streak.freezeBalance += 1;
        }
      } else if (state === "yellow") {
        streak.dailyStreak = previousStreak;
      } else {
        if (streak.freezeBalance > 0 && previousStreak > 0) {
          streak.freezeBalance -= 1;
          freezeUsed = 1;
          streak.dailyStreak = previousStreak;
        } else {
          streak.dailyStreak = 0;
        }
      }
    } else if (diffDays > 1) {
      streak.dailyStreak = state === "green" ? 1 : 0;
      streak.freezeBalance = 0;
    }
  }
  streak.lastProcessedDate = today;
  await streak.save();

  return {
    state,
    focusMinutes,
    streakCount: streak.dailyStreak,
    freezeUsed,
  };
}

export async function dialyStreakUpdate(userId, sessionMinutes) {
  const today = getStartOfDay();
  await dailyStatsModel.findOneAndUpdate(
    { userId, date: today },
    {
      $inc: {
        focusMinutes: sessionMinutes,
        sessions: 1
      }
    },
    { upsert: true, new: true }
  );
}