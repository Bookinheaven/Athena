import SessionService from "../services/sessionService.js";
import StreakService from "../services/streakService.js";
import sessionRepository from "../repositories/sessionRepository.js";

import generateInsights from "../utils/generateInsights.js";
import transformSessionForDashboard from "../utils/transformSessionForDashboard.js";
import { getStartOfDay } from "../utils/streakHelpers.js";

class SessionController {
  async startSession(req, res) {
    try {
      const session = await SessionService.start(req.user._id, req.body);
      res.status(201).json({ success: true, session });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async updateSession(req, res) {
    try {
      const userId = req.user._id;
      const { sessionId: _bodySessionId, ...restBody } = req.body || {};
      const { session, transitionedToCompleted } = await SessionService.update(userId, {
        ...restBody,
        sessionId: req.params.id,
      });
      if (transitionedToCompleted) {
        await StreakService.dailyStreakUpdate(
          userId,
          session.duration / 60,
          new Date(),
          req.timezone
        );
        await StreakService.processDailyStreak(userId, new Date(), req.timezone);
      }

      res.json({ success: true, session });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async checkpointProgress(req, res) {
    try {
      const userId = req.user._id;
      const session = await SessionService.checkpointProgress(userId, {
        ...req.body,
        sessionId: req.params.id,
      });
      res.json({ success: true, session });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async feedbackSession(req, res) {
    try {
      const userId = req.user._id || req.user.id;
      const feedbackData = req.body?.feedback || req.body || {};
      const session = await SessionService.feedback(userId, {
        sessionId: req.params.id,
        feedback: feedbackData,
        timezone: req.timezone,
      });
      res.json({ success: true, session });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async recordTaskOutcome(req, res) {
    try {
      const userId = req.user._id;
      const { taskOutcome, asOfDate } = req.body;
      const session = await SessionService.recordTaskOutcome(userId, {
        sessionId: req.params.id,
        taskOutcome,
        asOfDate,
        timezone: req.timezone,
      });
      res.json({ success: true, session });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async getActiveSession(req, res) {
    try {
      const userId = req.user?._id;
      const session = await SessionService.activeSessions(userId);
      res.status(200).json(session);
    } catch (error) {
      console.error("Error in getCurrentSession:", error);
      res.status(500).json({
        message: "Server error while fetching active session.",
        error: error.message,
      });
    }
  }

  async getSessions(req, res) {
    try {
      const userId = req.user._id;
      const sessions = await SessionService.sessions(userId);
      res.status(200).json(sessions);
    } catch (error) {
      console.error("Error in getSessions:", error);
      res.status(500).json({
        message: "Server error while fetching sessions.",
        error: error.message,
      });
    }
  }

  async getHistory(req, res) {
    try {
      const userId = req.user._id;
      const history = await SessionService.history(userId, req.query);
      res.status(200).json({ success: true, ...history });
    } catch (error) {
      console.error("Error in getHistory:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching session history.",
        error: error.message,
      });
    }
  }
  async getTodaysInsights(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) return res.status(404).json({ message: "user not found" });

      const startOfToday = getStartOfDay();
      const endOfToday = new Date(startOfToday);
      endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

      const todaysSessions = await sessionRepository.findUserSessionsInDateRange(
        userId,
        startOfToday,
        endOfToday
      );

      let output = {
        sessions: todaysSessions.length,
        focus_blocks: 0,
        longest_focus: 0,
        distractions: [],
      };

      let maxDuration = 0;

      for (let session of todaysSessions) {
        const focusSessions = session.sessionSegments || [];
        output.focus_blocks += focusSessions.length;
        if (session.duration > maxDuration) maxDuration = session.duration;
        if (session.sessionFeedback?.distractions && typeof session.sessionFeedback.distractions === "string") {
          const trimmed = session.sessionFeedback.distractions.trim();
          if (trimmed) {
            output.distractions.push(trimmed);
          }
        }
      }

      output.longest_focus = maxDuration;
      res.status(200).json({ insights: output });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Server error while generating Todays Insights.",
        error: error.message,
      });
    }
  }

  async getInsights(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) return res.status(404).json({ message: "user not found" });
      const allSessions = await sessionRepository.findUserSessions(userId);
      const insights = await generateInsights(userId, allSessions);
      const recentSessions = allSessions.map(transformSessionForDashboard);
      res.status(200).json({ insights, recentSessions });
    } catch (error) {
      console.error("Error in getInsights:", error);
      res.status(500).json({
        message: "Server error while generating insights.",
        error: error.message,
      });
    }
  }
}

export default new SessionController();
