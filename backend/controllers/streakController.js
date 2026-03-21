import StreakService from "../services/streakService.js";

class StreakController {
  
  async getSummary(req, res) {
    try {
      const userId = req.user.id;
      const data = await StreakService.getSummaryData(userId);
      res.status(201).json(data);
    } catch (error) {
      console.error("Streak summary error:", error);
      res.status(500).json({
        message: "Failed to fetch streak summary",
      });
    }
  }
}

export default new StreakController();
