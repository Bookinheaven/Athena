import Session from "../models/sessionModel.js";
import generateInsights from "../utils/generateInsights.js"
import transformSessionForDashboard from "../utils/transformSessionForDashboard.js";
import { processDailyStreak } from "../services/streakService.js"; 

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
      sessionSegments: session.segments,
      totalDuration: session.totalDuration,
      breakDuration: session.breakDuration,
      maxBreaks: session.maxBreaks,
      userSettings,
      userData,
      sessionFeedback,
      history,
      endedAt: session.isDone == true ? new Date() : null,
    };
    const existingSession = await Session.findOne({
      sessionId: sessionId,
      userId: userId,
    });

    // if there is no session like payload, then we clean all active sessions and change status to completed
    if (!existingSession) {
      await Session.updateMany(
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
    
    // duration calculation 
    sessionPayload.duration = 0;
    for (const segment of sessionPayload.sessionSegments){
      sessionPayload.duration += segment.duration;
    }
    
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

    if(sessionPayload.isDone){
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let streakData = await processDailyStreak(
          userId,
          today,
          sessionPayload.duration
      );
      // console.log(streakData)
    }

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

export const getTodaysInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    if (!userId) return res.status(404).json({message: "user not found"})
    const todaysSessions = await Session.find({userId, timestamp: {
      $gte: startOfToday,
      $lt: endOfToday,
    }})
    let output = {
      sessions: todaysSessions.length,
      focus_blocks: 0,
      longest_focus: 0,
      distractions: []
    }
    let maxDuration = 0 ;
    for (let session of todaysSessions){
      let focusSessions = session.sessionSegments.filter(s=> s.type == "focus")
      output.focus_blocks += focusSessions.length;
      let duration = focusSessions.reduce((accumulator, currentValue)=> accumulator+currentValue.duration, 0);
      if(maxDuration < duration) maxDuration = duration
      output.distractions.push(...session.sessionFeedback?.distractions)
    }
    output.longest_focus = maxDuration;
    res.status(200).json({ insights: output });
    
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Server error while generating Todays Insights.",
      error: error.message,
    })
  }
}

export const getInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const allSessions = await Session.find({ userId }).sort({ timestamp: -1 });
    const insights = await generateInsights(userId, allSessions);
    const recentSessions = allSessions
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
