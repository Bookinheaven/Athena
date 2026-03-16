import SessionService from "../services/sessionService.js";
import {
  dialyStreakUpdate,
  processDailyStreak,
} from "../services/streakService.js";
import Session from "../models/sessionModel.js";

import generateInsights from "../utils/generateInsights.js"
import transformSessionForDashboard from "../utils/transformSessionForDashboard.js"

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
      const session = await SessionService.update(userId, {
        sessionId: req.params.sessionId,
        updates: req.body,
      });
      if (session.status === "completed") {
        await dialyStreakUpdate(userId, session.duration / 60);
        await processDailyStreak(userId);
      }
      res.json({ success: true, session });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
  async feedbackSession(req, res) {
     try {
      const userId = req.user._id;
      const session = await SessionService.feedback(userId, {
        sessionId: req.params.sessionId,
        feedback: req.body,
      });
        res.json({success: true, session});
    } catch (err) {
      res.status(400).json({
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
      const sessions = await SessionService.activeSessions(userId); 
      res.status(200).json(sessions);
    } catch (error) {
      console.error("Error in getSessions:", error);
      res.status(500).json({
        message: "Server error while fetching sessions.",
        error: error.message,
      });
    }
  }
  // -------- need to work from here (-_-) ----------- //
  async getTodaysInsights (req, res) {
    try {
      const userId = req.user._id;

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);

      if (!userId) return res.status(404).json({ message: "user not found" });
      const todaysSessions = await Session.find({
        userId,
        timestamp: {
          $gte: startOfToday,
          $lt: endOfToday,
        },
      });
      let output = {
        sessions: todaysSessions.length,
        focus_blocks: 0,
        longest_focus: 0,
        distractions: [],
      };
      let maxDuration = 0;
      for (let session of todaysSessions) {
        let focusSessions = session.sessionSegments.filter(
          (s) => s.type == "focus",
        );
        output.focus_blocks += focusSessions.length;
        let duration = focusSessions.reduce(
          (accumulator, currentValue) => accumulator + currentValue.duration,
          0,
        );
        if (maxDuration < duration) maxDuration = duration;
        if (session.sessionFeedback?.distractions) {
          output.distractions.push(session.sessionFeedback.distractions);
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
      const userId = req.user._id;
      const allSessions = await Session.find({ userId }).sort({ timestamp: -1 });
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
