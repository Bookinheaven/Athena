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
router.get("/monthly", auth, StreakController.getMonthly);
router.get("/:type", auth, StreakController.getSpecific);

export default router;
