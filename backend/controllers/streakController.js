import Session from "../models/sessionModel.js";
import { updateDailyStreak } from "../services/streakService.js";

function getTodayFocusMinutes(userId) {
  return Session.aggregate([
    { $match: { userId, isDone: true, date: today } },
    { $unwind: "$segments" },
    { $match: { "segments.type": "focus" } },
    { $group: { _id: null, total: { $sum: "$segments.duration" } } }
  ]);
}


export async function completeSession(req, res) {
  const session = await Session.findById(req.params.id);

  session.isDone = true;
  await session.save();

  const todayFocusMinutes = await getTodayFocusMinutes(
    session.userId
  );

  let streak = await UserStreak.findOne({ userId: session.userId });
  if (!streak) {
    streak = await UserStreak.create({ userId: session.userId });
  }

  await updateDailyStreak({
    user: streak,
    todayFocusMinutes,
    todayDate: new Date()
  });

  res.json({ success: true });
}
