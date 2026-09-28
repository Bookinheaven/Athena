import mongoose from "mongoose";
import Session from "../models/sessionModel.js";
import ScheduleBlock from "../models/scheduleBlockModel.js";
import Task from "../models/taskModel.js";

class SessionService {
  async start(userId, payload) {
    const {
      sessionId,
      title,
      sessionSegments,
      plannedDuration,
      taskIds,
      totalBreakMinutes,
      totalFocusMinutes,
      pauseEvents,
      scheduleBlockId,
    } = payload;

    if (!sessionId || !sessionSegments?.length) {
      throw new Error("Invalid session payload");
    }

    let resolvedScheduleBlock = null;
    let effectivePlannedDuration = plannedDuration;
    let effectiveTaskIds = taskIds || [];

    if (scheduleBlockId) {
      if (!mongoose.Types.ObjectId.isValid(scheduleBlockId)) {
        throw new Error("Invalid scheduleBlockId format");
      }

      resolvedScheduleBlock = await ScheduleBlock.findOne({
        _id: scheduleBlockId,
        userId,
      });

      if (!resolvedScheduleBlock) {
        throw new Error("ScheduleBlock not found or access denied");
      }

      if (resolvedScheduleBlock.status === "completed") {
        throw new Error("Cannot start Focus session: ScheduleBlock is already completed");
      }

      if (resolvedScheduleBlock.status === "skipped") {
        throw new Error("Cannot start Focus session: ScheduleBlock is skipped");
      }

      if (resolvedScheduleBlock.status !== "scheduled") {
        throw new Error("Cannot start Focus session: Invalid ScheduleBlock status");
      }

      if (resolvedScheduleBlock.sessionId) {
        throw new Error("Cannot start Focus session: ScheduleBlock already has an associated session");
      }

      // Verify the referenced Task also belongs to this user
      const task = await Task.findOne({
        _id: resolvedScheduleBlock.taskId,
        user: userId,
      });

      if (!task) {
        throw new Error("Associated task not found or access denied");
      }

      // Planned duration derived from block (durationMinutes * 60 seconds)
      effectivePlannedDuration = resolvedScheduleBlock.durationMinutes * 60;

      // Ensure taskIds includes the ScheduleBlock's taskId
      const taskIdStr = resolvedScheduleBlock.taskId.toString();
      const existingTaskIdStrs = (effectiveTaskIds || []).map((id) =>
        id.toString()
      );
      if (!existingTaskIdStrs.includes(taskIdStr)) {
        effectiveTaskIds = [resolvedScheduleBlock.taskId, ...effectiveTaskIds];
      }
    }

    // if current session is same session as before and it is active then send it back.
    const oldSession = await this.getSession(userId, sessionId);

    if (oldSession && oldSession.status === "active") return oldSession;

    // Close any active sessions (marked abandoned; do not auto-complete their schedule blocks)
    await Session.updateMany(
      { userId, status: "active" },
      {
        $set: {
          status: "completed",
          completionType: "abandoned",
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
          scheduleBlockId: resolvedScheduleBlock
            ? resolvedScheduleBlock._id
            : null,
          title: title || (resolvedScheduleBlock ? "Focus Session" : "Untitled Work"),
          taskIds: effectiveTaskIds,
          sessionType:
            payload.sessionType || (resolvedScheduleBlock ? "task" : "quick"),
          status: "active",
          startedAt: new Date(),
          sessionSegments,
          plannedDuration: effectivePlannedDuration,
          totalBreakMinutes,
          totalFocusMinutes,
          pauseEvents: pauseEvents || [],
        },
      },
      { upsert: true, new: true }
    ).populate("scheduleBlockId");

    return session;
  }

  async getSession(userId, sessionId) {
    return await Session.findOne({ userId, sessionId }).populate(
      "scheduleBlockId"
    );
  }

  async update(userId, payload) {
    const { sessionId, segment, title, status, todos, pauseEvents } = payload;
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
      if (!existing) {
        return { session, transitionedToCompleted: false };
      }
      const total = existing?.totalDuration || 0;
      if (segment.duration !== undefined) {
        updateData[`sessionSegments.${segment.segmentIndex}.duration`] = Math.max(
          existing?.duration || 0,
          segment.duration
        );
      }
      if (segment.completedAt) {
        updateData[`sessionSegments.${segment.segmentIndex}.completedAt`] =
          segment.completedAt;
        updateData[`sessionSegments.${segment.segmentIndex}.duration`] = total;
      }
    }

    if (title) {
      updateData.title = title;
    }
    if (Array.isArray(todos)) {
      updateData.todos = todos;
    }
    if (pauseEvents && Array.isArray(pauseEvents)) {
      updateData.pauseEvents = pauseEvents;
    }

    let transitionedToCompleted = false;
    if (status === "completed" || status === "skipped") {
      const completionType = status === "skipped" ? "skipped" : "completed";
      const transitionSet = {
        status: "completed",
        completionType,
        endedAt: new Date(),
      };
      if (payload.sessionStats) {
        transitionSet.sessionStats = payload.sessionStats;
      }

      const transitionResult = await Session.updateOne(
        { sessionId, userId, status: { $ne: "completed" } },
        { $set: transitionSet }
      );

      transitionedToCompleted = transitionResult.modifiedCount === 1;

      // When session successfully transitions to completed, update linked ScheduleBlock
      if (
        transitionedToCompleted &&
        status === "completed" &&
        session.scheduleBlockId
      ) {
        await ScheduleBlock.updateOne(
          { _id: session.scheduleBlockId, userId, status: "scheduled" },
          {
            $set: {
              status: "completed",
              sessionId: session._id,
            },
          }
        );
      }
    }

    const segments = session.sessionSegments || [];
    const totalDuration = segments.reduce((sum, seg, idx) => {
      let duration = seg.duration || 0;
      const total = seg.totalDuration || 0;
      if (segment && segment.segmentIndex === idx) {
        if (segment.completedAt) {
          duration = total;
        } else if (segment.duration !== undefined) {
          duration = Math.max(duration, segment.duration);
        }
      }
      const safe = Math.min(duration, seg.totalDuration || Infinity);
      return sum + safe;
    }, 0);

    updateData.duration = totalDuration;

    const updatedSession = await Session.findOneAndUpdate(
      { sessionId, userId },
      { $set: updateData },
      { new: true }
    ).populate("scheduleBlockId");

    return {
      session: updatedSession,
      transitionedToCompleted,
    };
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
      { new: true }
    ).populate("scheduleBlockId");
    return session;
  }

  async activeSessions(userId) {
    if (!userId) {
      throw new Error("User not found.");
    }
    const session = await Session.findOne({
      userId,
      status: "active",
    }).populate("scheduleBlockId");
    return session;
  }

  async sessions(userId) {
    if (!userId) {
      throw new Error("User not found.");
    }
    const session = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .populate("scheduleBlockId");
    return session;
  }

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
