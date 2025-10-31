import Session from "../models/sessionModel.js";
import generateInsights from "../utils/generateInsights.js"
import transformSessionForDashboard from "../utils/transformSessionForDashboard.js";

export const logSession = async (req, res) => {
  try {
    const {
      sessionId,
      session,
      userSettings,
      userData,
      sessionFeedback,
      history,
    } = req.body;

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }
    if (!session || !sessionId) {
      return res
        .status(400)
        .json({ message: "Session ID and session data are required." });
    }

    const sessionPayload = {
      userId,
      sessionId,
      title: session.title,
      timestamp: session.timestamp || new Date(),
      isDone: session.isDone || false,
      status: session.isDone ? "completed" : "active",
      segmentIndex: session.segmentIndex,
      segments: session.segments,
      totalDuration: session.totalDuration,
      breakDuration: session.breakDuration,
      maxBreaks: session.maxBreaks,
      userSettings,
      userData,
      sessionFeedback,
      history,
    };
    const existingSession = await Session.findOne({
      sessionId: sessionId,
      userId: userId,
    });
    if (!existingSession && sessionPayload.status === "active") {
      // console.log(`New active session (${sessionId}). Cleaning up old active sessions for user ${userId}...`);
      const updateResult = await Session.updateMany(
        {
          userId: userId,
          status: "active",
          sessionId: { $ne: sessionId },
        },
        {
          $set: {
            status: "completed",
            isDone: false,
            endedAt: new Date(),
          },
        }
      );
    }
    // console.log("Session Payload to Save/Update:", JSON.stringify(sessionPayload, null, 2));
    const savedSession = await Session.findOneAndUpdate(
      { sessionId: sessionId, userId: userId },
      { $set: sessionPayload },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
    const statusCode = existingSession ? 200 : 201;
    return res.status(statusCode).json(savedSession);
  } catch (error) {
    console.error("Error in logSession:", error);
    res.status(500).json({
      message: "Server error while saving session.",
      error: error.message,
    });
  }
};

export const getCurrentSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }
    const session = await Session.findOne({ userId, status: "active" });
    res.status(200).json(session);
  } catch (error) {
    console.error("Error in getCurrentSession:", error);
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
        message: "Server error while fetching sessions.",
        error: error.message,
      });
  }
};

export const getInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const allSessions = await Session.find({ userId }).sort({ timestamp: -1 });
    const insights = await generateInsights(userId, allSessions);
    const recentSessions = allSessions
      .slice(0, 4)
      .map(transformSessionForDashboard);
    res.status(200).json({ insights, recentSessions });
  } catch (error) {
    console.error("Error in getInsights:", error);
    res
      .status(500)
      .json({
        message: "Server error while generating insights.",
        error: error.message,
      });
  }
};
