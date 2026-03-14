import Session from "../models/sessionModel.js";
import { processDailyStreak } from "../services/streakService.js";
import { getStartOfDay } from "../utils/streakHelpers.js";

export async function completeSession(req, res) {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.isDone) {
      return res.json({ success: true });
    }
    session.isDone = true;
    session.status = "completed";
    session.endedAt = new Date();
    await session.save();

    const today = getStartOfDay(new Date());
    
    await processDailyStreak(session.userId, today);
    res.json({ success: true });
  } catch (error) {
    console.error("completeSession error:", error);
    res.status(500).json({ message: "Server error" });
  }
}
