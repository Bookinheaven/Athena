import StreakService from "../services/streakService.js";

class StreakController {
  async getSummary(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const data = await StreakService.getSummaryData(
        userId,
        new Date(),
        req.timezone
      );
      res.status(200).json(data);
    } catch (error) {
      console.error("Streak summary error:", error);
      res.status(500).json({
        message: "Failed to fetch streak summary",
      });
    }
  }

  async getSpecific(req, res) {
    try {
      const type = req.params.type;
      const userId = req.user.id || req.user._id;
      const data = await StreakService.getSpecificField(userId, type);
      const obj = data && typeof data.toObject === "function" ? data.toObject() : (data || {});
      res.status(200).json({ success: true, ...obj });
    } catch (err) {
      res.status(500).json({
        message: "Failed to fetch streak get Specific",
      });
    }
  }

  async getMonthly(req, res) {
    try {
      const { year, month } = req.query;
      const userId = req.user.id || req.user._id;
      const days = await StreakService.getMonthlyStats(
        userId,
        year,
        month,
        req.timezone
      );
      res.json(days);
    } catch (err) {
      res.status(500).json({
        message: "Failed to fetch monthly streak stats",
      });
    }
  }
}

export default new StreakController();
