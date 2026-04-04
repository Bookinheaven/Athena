import Session from "../models/sessionModel.js";

class SessionService {
  async start(userId, payload) {
    const { sessionId, title, sessionSegments, plannedDuration, taskIds, totalBreakMinutes, totalFocusMinutes } = payload;
    if (!sessionId || !sessionSegments?.length) {
      throw new Error("Invalid session payload");
    }
    // if current session is same session as before and it is active then send it back.
    const oldSession = await this.getSession(userId, sessionId);
    
    if (oldSession && oldSession.status == "active") return oldSession;
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
          taskIds: taskIds || [],
          sessionType: payload.sessionType || "quick",
          status: "active",
          startedAt: new Date(),
          sessionSegments,
          plannedDuration,
          totalBreakMinutes,
          totalFocusMinutes
        },
      },
      { upsert: true, new: true },
    );

    return session;
  }

  async getSession(userId, sessionId) {
    return await Session.findOne({ userId, sessionId });
  }

  async update(userId, payload) {
    const { sessionId, segment, title, status, todos } = payload;
    if (!sessionId) {
      throw new Error("Session id required");
    }
    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      throw new Error("Session not found");
    }
    const updateData = {};
    if (segment) {
      const existing = session.sessionSegments?.[segment.segmentIndex];
      if (!existing) return session;
      const total = existing?.totalDuration || 0;
      if (segment.duration !== undefined) {
        updateData[`sessionSegments.${segment.segmentIndex}.duration`] = Math.max(existing?.duration || 0, segment.duration);
      }
      if (segment.completedAt) {
        updateData[`sessionSegments.${segment.segmentIndex}.completedAt`] = segment.completedAt;
        updateData[`sessionSegments.${segment.segmentIndex}.duration`] = total; 
      }
    }
    if (title) {
      updateData.title = title;
    }
    if (Array.isArray(todos)) {
      updateData.todos = todos;
    }
    if (status === "completed") {
      updateData.status = "completed";
      updateData.endedAt = new Date();
    }
    const updatedSession = await Session.findOneAndUpdate(
      { sessionId, userId },
      { $set: updateData },
      { new: true }
    );

    const totalDuration = updatedSession.sessionSegments.reduce((sum, seg) => {
      const safe = Math.min(seg.duration || 0, seg.totalDuration || Infinity);
      return sum + safe;
    }, 0);

    updatedSession.duration = totalDuration;
    await updatedSession.save();

    return updatedSession;
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
    const session = await Session.findOne({ userId, status: "active" });
    // console.log(session);
    return session;
  }

  async sessions(userId) {
    if (!userId) {
      throw new Error("User not found.");
    }
    const session = await Session.find({ userId }).sort({ createdAt: -1 });
    return session;
  }

  // -------- need to work from here (-_-) ----------- //
  async getInsights(userId, type = null) {
    switch (type) {
      case "today": {
      }
      default: {
      }
    }
  }
}

export default new SessionService();
