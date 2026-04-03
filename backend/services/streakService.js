import Streak from "../models/streakModel.js";
import DailyStats from "../models/dailyStatsModel.js";
import { getStartOfDay, isSameDay } from "../utils/streakHelpers.js";

class StreakService {
  async getSummaryData(userId) {
    const streakData = await this.processDailyStreak(userId);
    const userData = await Streak.findOne({ userId }).select(
      "-_id -__v -lastProcessedDate -createdAt -updatedAt",
    );
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

    // SAME DAY LOGIC (REAL-TIME)
    if (diffDays === 0) {
      let updated = false;

      if (state === "green" && !isSameDay(streak.lastCountedDate, today)) {
        // safe increment
        if (!lastDate || diffDays === 1 || diffDays === 0) {
          streak.currentStreak += 1;
        } else {
          streak.currentStreak = 1;
        }

        streak.lastCountedDate = today;
        updated = true;
      }

      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
        updated = true;
      }

      if (updated) {
        await streak.save();
      }

      return {
        state,
        focusMinutes,
        streakCount: streak.currentStreak,
        freezeUsed: 0,
      };
    }

    const previousStreak = streak.currentStreak;
    let freezeUsed = 0;

    // FIRST TIME USER
    if (!lastDate) {
      if (state === "green") {
        streak.currentStreak = 1;
        streak.lastCountedDate = today;
      } else {
        streak.currentStreak = 0;
        streak.lastCountedDate = null;
      }
    }

    // NEXT DAY (CONSECUTIVE)
    else if (diffDays === 1) {
      if (state === "green") {
        if (!isSameDay(streak.lastCountedDate, today)) {
          streak.currentStreak = previousStreak + 1;
          streak.lastCountedDate = today;
        }

        // reward freeze every 7 days
        if (
          streak.currentStreak % 7 === 0 &&
          streak.freezeBalance < streak.maxFreezeBalance
        ) {
          streak.freezeBalance += 1;
        }
      } else if (state === "yellow") {
        // maintain streak
        streak.currentStreak = previousStreak;
      } else {
        // RED DAY
        if (streak.freezeBalance > 0 && previousStreak > 0) {
          streak.freezeBalance -= 1;
          streak.totalFreezesUsed += 1;
          freezeUsed = 1;

          streak.currentStreak = previousStreak;

          // preserve last counted date
          streak.lastCountedDate = streak.lastCountedDate || lastDate;
        } else {
          streak.currentStreak = 0;
          streak.lastCountedDate = null;
        }
      }
    }

    // MISSED MULTIPLE DAYS
    else if (diffDays > 1) {
      streak.currentStreak = state === "green" ? 1 : 0;
      streak.freezeBalance = 0;

      if (state === "green") {
        streak.lastCountedDate = today;
      } else {
        streak.lastCountedDate = null;
      }
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
