import Streak from "../models/streakModel.js";
import DailyStats from "../models/dailyStatsModel.js";
import { getStartOfDay } from "../utils/streakHelpers.js";

class StreakService {
  async getSummaryData(userId) {
    const streakData = await this.processDailyStreak(userId);
    const userData = await Streak.findOne({ userId })
      .select("-_id -__v -lastProcessedDate -createdAt -updatedAt");
    return { ...userData.toObject(), ...streakData };
  }

  async processDailyStreak(userId) {
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

    const diffDays = lastDate
      ? Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))
      : null;

    // already processed today — return current state without saving
    if (diffDays === 0) {
      return {
        state,
        focusMinutes,
        streakCount: streak.currentStreak,
        freezeUsed: 0,
      };
    }

    const previousStreak = streak.currentStreak;
    let freezeUsed = 0;

    if (!lastDate) {
      // first time ever
      streak.currentStreak = state === "green" ? 1 : 0;
    } else if (diffDays === 1) {
      // consecutive day
      if (state === "green") {
        streak.currentStreak = previousStreak + 1;
        if (
          streak.currentStreak % 7 === 0 &&
          streak.freezeBalance < streak.maxFreezeBalance
        ) {
          streak.freezeBalance += 1;
        }
      } else if (state === "yellow") {
        streak.currentStreak = previousStreak;
      } else {
        // red
        if (streak.freezeBalance > 0 && previousStreak > 0) {
          streak.freezeBalance -= 1;
          streak.totalFreezesUsed += 1;
          freezeUsed = 1;
          streak.currentStreak = previousStreak;
        } else {
          streak.currentStreak = 0;
        }
      }
    } else if (diffDays > 1) {
      // missed multiple days
      streak.currentStreak = state === "green" ? 1 : 0;
      streak.freezeBalance = 0;
    }

    streak.lastProcessedDate = today;

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    await streak.save();

    return {
      state,
      focusMinutes,
      streakCount: streak.currentStreak,
      freezeUsed,
    };
  }

  async dailyStreakUpdate(userId, sessionMinutes) {
    const today = getStartOfDay();
    await DailyStats.findOneAndUpdate(
      { userId, date: today },
      {
        $inc: {
          focusMinutes: sessionMinutes,
          sessions: 1,
        },
      },
      { upsert: true, new: true },
    );
  }
  
  async getSpecificField(userId, type) {
    const data = await Streak.findOne({ userId }).select(`${type} -_id`);
    return data;
  }
}

export default new StreakService();