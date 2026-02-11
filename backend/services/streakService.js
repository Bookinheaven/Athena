import streakModel from "../models/streakModel.js";
import User from "../models/userModel.js";

export async function processDailyStreak(userId, date, focusMinutes) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  // Convert seconds to minutes
  focusMinutes = Math.floor(Number(focusMinutes / 60));

  // Normalize today's date
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  // Get last processed date
  const lastProcessedDate = user.streak.lastProcessedDate ? new Date(user.streak.lastProcessedDate) : null;
  if (lastProcessedDate) {
    lastProcessedDate.setHours(0, 0, 0, 0);
  }

  // Check if record already exists for today
  let currentRecord = await streakModel.findOne({ userId, date: today });

  if (currentRecord) {
    if (currentRecord.state == "green") {
      return {
        dailyTargetMinutes: currentRecord.dailyTargetMinutes,
        focusMinutes: currentRecord.focusMinutes,
        state: currentRecord.state,
        streakRate: currentRecord.streakRate,
        usedFreeze: currentRecord.usedFreeze,
      };
    }
    // Add previous minutes (updating same day)
    focusMinutes += currentRecord.focusMinutes;
  }
  
  const target = Math.max(user.streak.dailyTargetMinutes, 1);
  const streakRate = focusMinutes / target;

  let state = "red";
  if (streakRate >= 1) state = "green";
  else if (streakRate >= 0.7) state = "yellow";

  let freezeUsed = 0;
  let diffDays = 0;

  if (!lastProcessedDate) {
    // First ever streak entry
    user.streak.dailyStreak = state === "green" ? 1 : 0;
  } else {
    const diffTime = today - lastProcessedDate;
    diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if(diffDays === 0) {
      // same day -> No Streak need
    } else if(diffDays === 1){
      if (state === "green"){
        user.streak.dailyStreak += 1;

        // Earns streak freeze every 7 days
        if (user.streak.dailyStreak % 7 === 0 && user.streak.freezeBalance < user.streak.maxFreezeBalance){
          user.streak.freezeBalance += 1;
        } 
      } else if (state === "yellow"){
        // streak preserved, no increment, no freeze usage
        // 0.5 streak. two days: 1 streak (Later)
      } else {
        // red day
        if (user.streak.freezeBalance > 0) {
          user.streak.freezeBalance -= 1;
          freezeUsed = 1;
        } else {
          user.streak.dailyStreak = 0;
        }
      }
    } else {
      // Missed more than 1 day -> streak broken
      if (state === "green") {
        user.streak.dailyStreak = 1;
      } else {
        user.streak.dailyStreak = 0;
      }
    }
  }
  user.streak.lastProcessedDate = new Date();

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
    { upsert: true, new: true },
  );
  return {
    dailyTargetMinutes: dailyRecord.dailyTargetMinutes,
    focusMinutes: dailyRecord.focusMinutes,
    state: dailyRecord.state,
    streakRate: dailyRecord.streakRate,
    usedFreeze: dailyRecord.usedFreeze,
  };
}
