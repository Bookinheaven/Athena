import express from "express";
import auth from '../middlewares/authMiddleware.js';
import StreakController from "../controllers/streakController.js";

const router = express.Router();

// router.get("/process-today", auth, async (req, res) => {
//   const userId = req.user.id;

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   await StreakService.processDailyStreak(userId, today);

//   res.json({ success: true });
// });

router.get("/summary", auth, StreakController.getSummary);


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

router.get("/:type", auth, StreakController.getSpecific)

export default router;
