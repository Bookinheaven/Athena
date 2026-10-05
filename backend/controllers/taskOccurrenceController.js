import TaskOccurrenceService from "../services/taskOccurrenceService.js";
import StreakService from "../services/streakService.js";

class TaskOccurrenceController {
  async getOccurrences(req, res) {
    try {
      const userId = req.user.id;
      const occurrences = await TaskOccurrenceService.getOccurrences(
        userId,
        req.query,
        req.timezone
      );
      res.status(200).json({ success: true, occurrences });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createOccurrence(req, res) {
    try {
      const userId = req.user.id;
      const occurrence = await TaskOccurrenceService.ensureOccurrence(
        userId,
        req.body,
        req.timezone
      );
      await StreakService.processDailyStreak(userId, new Date(), req.timezone);
      res.status(201).json({ success: true, occurrence });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateOutcome(req, res) {
    try {
      const userId = req.user.id;
      const occurrence = await TaskOccurrenceService.recordOutcome(
        userId,
        req.params.id,
        req.body
      );
      await StreakService.processDailyStreak(userId, new Date(), req.timezone);
      res.status(200).json({ success: true, occurrence });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async rescheduleOccurrence(req, res) {
    try {
      const userId = req.user.id;
      const result = await TaskOccurrenceService.reschedule(
        userId,
        req.params.id,
        req.body.newDate,
        req.timezone
      );
      await StreakService.processDailyStreak(userId, new Date(), req.timezone);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async rolloverTasks(req, res) {
    try {
      const userId = req.user.id;
      const { fromProductDate, toProductDate, taskIds } = req.body;
      const result = await TaskOccurrenceService.rolloverTasks(
        userId,
        fromProductDate,
        toProductDate,
        taskIds,
        req.timezone
      );
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new TaskOccurrenceController();
