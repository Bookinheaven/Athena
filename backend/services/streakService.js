import streakModel from "../models/streakModel.js";
import User from "../models/userModel.js";

export async function processDailyStreak(userId, date, focusMinutes = 0) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Normalize date
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const existingDaily = await streakModel.findOne({ userId, date: today });
  
  if (existingDaily) {
    return { dailyTargetMinutes: existingDaily.dailyTargetMinutes, focusMinutes: existingDaily.focusMinutes, state: existingDaily.state, streakRate: existingDaily.streakRate, usedFreeze: existingDaily.usedFreeze};
  }

  const target = Math.max(user.streak.dailyTargetMinutes, 1);
  const streakRate = focusMinutes / target;

  let state = "red";
  if (streakRate >= 1) state = "green";
  else if (streakRate >= 0.7) state = "yellow";

  let freezeUsed = 0;

  if (state === "green") {
    user.streak.dailyStreak += 1;
    // Earn freeze every 7 days
    if (
      user.streak.dailyStreak % 7 === 0 &&
      user.streak.freezeBalance < user.streak.maxFreezeBalance
    ) {
      user.streak.freezeBalance += 1;
    }
  }

  else if (state === "yellow") {
    // streak preserved, no increment, no freeze usage
  }

  else {
    // red day
    if (user.streak.freezeBalance > 0) {
      user.streak.freezeBalance -= 1;
      freezeUsed = 1;
    } else {
      user.streak.dailyStreak = 0;
    }
  }

  user.streak.lastProcessedDate = today;
  await user.save();

  const dailyRecord = await streakModel.findOneAndUpdate(
    { userId, date: today },
    {
      userId,
      date: today,
      focusMinutes,
      dailyTargetMinutes: target,
      streakRate,
      state,
      freezeUsed,
    },
    { upsert: true, new: true }
  );
  return { dailyTargetMinutes: dailyRecord.dailyTargetMinutes, focusMinutes: dailyRecord.focusMinutes, state: dailyRecord.state, streakRate: dailyRecord.streakRate, usedFreeze: dailyRecord.usedFreeze};
}
