import Session from "../models/sessionModel.js";

class SessionService {
  async start(userId, payload) {
    const {
      sessionId,
      title,
      sessionSegments,
      taskId,
      sessionType,
      plannedDuration,
    } = payload;

    if (!sessionId || !sessionSegments?.length) {
      throw new Error("Invalid session payload");
    }

    // Close any active sessions
    await Session.updateMany(
      { userId, status: "active" },
      {
        $set: {
          status: "completed",
          endedAt: new Date(),
        },
      },
    );

    const session = await Session.findOneAndUpdate(
      { sessionId, userId },
      {
        $setOnInsert: {
          userId,
          sessionId,
          title: title || "Untitled Work",
          taskId: taskId || null,
          sessionType: sessionType || "quick",
          status: "active",
          startedAt: new Date(),
          sessionSegments,
          plannedDuration,
        },
      },
      { upsert: true, new: true },
    );

    return session;
  }

  async update(userId, payload) {
    const { sessionId, updates } = payload;

    if (!sessionId) {
      throw new Error("Session id required");
    }

    const session = await Session.findOneAndUpdate(
      { sessionId: sessionId, userId },
      { $set: updates },
      { new: true },
    );

    if (!session) {
      throw new Error("Session not found");
    }

    return session;
  }

  async feedback(userId, payload) {
    const { sessionId, feedback } = payload;

    const session = await Session.findOneAndUpdate(
      { sessionId, userId },
      {
        $set: {
          sessionFeedback: feedback,
        },
      },
      { new: true },
    );

    return session;
  }

  async activeSessions(userId) {
    if (!userId) {
      throw new Error("User not found.");
    }
    const session = await Session.findOne({ _id:userId, status: "active" }); 
    return session;
  }

  async sessions(userId) {
    if (!userId) {
      throw new Error("User not found.");
    }
    const session = await Session.find({ userId }).sort({ timestamp: -1 });
    return session;
  }

  // -------- need to work from here (-_-) ----------- //
  async getInsights(userId, type=null) {
    switch(type){
      case "today": {

      }
      default : {

      }
    }
  }
}

export default new SessionService();
