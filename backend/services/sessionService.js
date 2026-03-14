import Session from "../models/sessionModel.js";

export const start = async (userId, data) => {
  const { sessionId, title, sessionSegments, taskId, sessionType, plannedDuration } = data;

  if (!sessionId || !sessionSegments?.length) {
    throw new Error("Invalid session payload");
  }

  await Session.updateMany(
    { userId, status: "active" },
    {
      $set: {
        status: "completed",
        endedAt: new Date(),
      },
    }
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
    { upsert: true, new: true }
  );

  return session;
};

export const update = async (userId, data) => {
  const { id, updates } = data;

  if (!id) {
    throw new Error("Session id required");
  }
  console.log(updates.action.sessionSegments)
  const session = await Session.findOneAndUpdate(
    { sessionId: id, userId },
    { $set: updates?.action },
    { new: true },
  );
  if (!session) {
    throw new Error("Session not found");
  }

  return session;
};

export const feedback = async (userId, data) => {
  const { id, action } = data;
};
