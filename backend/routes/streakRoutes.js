import express from "express";
import auth from '../middlewares/authMiddleware.js';
import { processDailyStreak } from "../services/streakService.js"; 
import User from "../models/userModel.js";
import dailyStatsModel from "../models/dailyStatsModel.js";

const router = express.Router();

router.get("/process-today", auth, async (req, res) => {
  const userId = req.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await processDailyStreak(userId, today);

  res.json({ success: true });
});

router.get("/summary", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    let streakData = dailyStatsModel.findOne({ userId }).selectedInclusively("dailyTargetMinutes focusMinutes state freezeUsed streakRate resultType streakCount")

    if (!streakData) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      streakData = await processDailyStreak(
        userId,
        today,
        0 
      );
    }
    const userData = await User.findById(req.user.id).select("streak");
    res.json({...userData.streak, ...streakData});
  } catch (error) {
    console.error("Streak summary error:", error);
    res.status(500).json({
      message: "Failed to fetch streak summary",
    });
  }
});


router.get("/monthly", auth, async (req, res) => {
  const { year, month } = req.query;
  const userId = req.user.id;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const days = await StreakDay.find({
    userId,
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  res.json(days);
});

export default router;
