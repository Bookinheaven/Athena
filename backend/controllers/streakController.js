import StreakService from "../services/streakService.js";

class StreakController {
  async getSummary(req, res) {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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

  async getAdaptiveTarget(req, res) {
    try {
      const userId = req.user.id;
      const recommendation = await StreakService.evaluateAdaptiveTarget(
        userId,
        new Date(),
        req.timezone
      );
      res.status(200).json({
        success: true,
        recommendation,
      });
    } catch (err) {
      console.error("Adaptive target error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to evaluate adaptive target",
      });
    }
  }

  async applyAdaptiveTarget(req, res) {
    try {
      const userId = req.user.id;
      const result = await StreakService.applyAdaptiveTarget(
        userId,
        req.body?.targetMinutes,
        req.timezone
      );
      res.status(200).json({
        success: true,
        message: "Daily focus target updated successfully",
        ...result,
      });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || "Failed to apply adaptive target",
      });
    }
  }

  async updateTargetSettings(req, res) {
    try {
      const userId = req.user.id;
      const updated = await StreakService.updateTargetSettings(userId, req.body);
      res.status(200).json({
        success: true,
        message: "Target settings saved successfully",
        streak: updated,
      });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || "Failed to update target settings",
      });
    }
  }
}

export default new StreakController();
