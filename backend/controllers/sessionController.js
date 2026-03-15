import Session from "../models/sessionModel.js";
import generateInsights from "../utils/generateInsights.js";
import transformSessionForDashboard from "../utils/transformSessionForDashboard.js";
import {
  dialyStreakUpdate,
  processDailyStreak,
} from "../services/streakService.js";
import { start, update } from "../services/sessionService.js";
import User from "../models/userModel.js";

export const startSession = async (req, res) => {
  try {
    const session = await start(req.user._id, req.body);
    return res.status(201).json({
      success: true,
      session,
    });
  } catch (err) {
    console.error("Error in startSession:", err);
    
    return res.status(500).json({
      success: false,
      message: "Failed to start session",
    });
  }
};

export const updateSession = async (req, res) => {
  try {
    let userId = req.user._id;
    const session = await update(userId, {
      id: req.params.id,
      updates: req.body,
    });
    if (session.status === "completed"){
      dialyStreakUpdate(userId, session.duration/60);
      let streakData = await processDailyStreak(userId);
      console.log(streakData)
    }
    return res.json(session);
  } catch (err) {
    console.error(err);

    return res.status(400).json({
      message: err.message,
    });
  }
};
export const submitFeedback = async (req, res) => {
  // need to work here
};

export const getActiveSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }
    const session = await Session.findOne({ userId, status: "active" });
    const user = await User.findOne({ _id: userId });
    console.log(user)
    res.status(200).json(session);
  } catch (error) {
    console.error("Error in getCurrentSession:", error);
    res.status(500).json({
      message: "Server error while fetching session.",
      error: error.message,
    });
  }
};

export const getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessions = await Session.find({ userId }).sort({ timestamp: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error in getSessions:", error);
    res.status(500).json({
      message: "Server error while fetching sessions.",
      error: error.message,
    });
  }
};

export const getTodaysInsights = async (req, res) => {
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
};

export const getInsights = async (req, res) => {
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
};
