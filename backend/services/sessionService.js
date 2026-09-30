import mongoose from "mongoose";
import Session from "../models/sessionModel.js";
import ScheduleBlock from "../models/scheduleBlockModel.js";
import Task from "../models/taskModel.js";
import { parseDateRange } from "../utils/dateUtils.js";

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
          scheduleSnapshot: resolvedScheduleBlock
            ? {
                scheduleBlockId: resolvedScheduleBlock._id,
                date: resolvedScheduleBlock.date,
                startTime: resolvedScheduleBlock.startTime,
                endTime: resolvedScheduleBlock.endTime,
                durationMinutes: resolvedScheduleBlock.durationMinutes,
              }
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

    // Historical execution immutability: terminal completed sessions cannot have their execution facts mutated
    if (session.status === "completed") {
      return { session, transitionedToCompleted: false };
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
    if (status === "completed" || status === "skipped" || status === "abandoned") {
      const completionType =
        status === "skipped"
          ? "skipped"
          : status === "abandoned"
          ? "abandoned"
          : "completed";
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
    const sessions = await Session.find({
      userId,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .populate("scheduleBlockId");

    if (!sessions || sessions.length === 0) {
      return null;
    }

    const latest = sessions[0];

    // Clean up older duplicate active sessions if any exist
    if (sessions.length > 1) {
      const olderIds = sessions.slice(1).map((s) => s._id);
      await Session.updateMany(
        { _id: { $in: olderIds } },
        {
          $set: {
            status: "completed",
            completionType: "abandoned",
            endedAt: new Date(),
          },
        }
      );
    }

    // Auto-complete if all segments are already completed
    const allSegmentsDone =
      latest.sessionSegments?.length > 0 &&
      latest.sessionSegments.every((s) => s.completedAt);

    if (allSegmentsDone) {
      await Session.updateOne(
        { _id: latest._id },
        {
          $set: {
            status: "completed",
            completionType: "completed",
            endedAt: latest.endedAt || new Date(),
          },
        }
      );
      return null;
    }

    // Check if session is stale/abandoned after long inactivity
    const plannedSecs = latest.plannedDuration || 1500;
    const lastActiveDate = latest.updatedAt || latest.startedAt || latest.createdAt;
    const lastActiveMs = new Date(lastActiveDate).getTime();
    const nowMs = Date.now();
    const maxInactiveMs = Math.max(plannedSecs * 1000 + 2 * 60 * 60 * 1000, 4 * 60 * 60 * 1000);

    if (nowMs - lastActiveMs > maxInactiveMs) {
      await Session.updateOne(
        { _id: latest._id },
        {
          $set: {
            status: "completed",
            completionType: "abandoned",
            endedAt: new Date(lastActiveMs),
          },
        }
      );
      return null;
    }

    return latest;
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

  /**
   * Filtered, paginated history query service for historical sessions.
   *
   * @param {string | mongoose.Types.ObjectId} userId
   * @param {object} [query={}]
   * @param {number} [query.page=1]
   * @param {number} [query.limit=20]
   * @param {string} [query.startDate]
   * @param {string} [query.endDate]
   * @param {string} [query.taskId]
   * @param {string} [query.status]
   * @param {string} [query.completionType]
   * @returns {Promise<{ sessions: Array, pagination: object }>}
   */
  async history(userId, query = {}) {
    if (!userId) {
      throw new Error("User not found.");
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId };

    if (query.startDate || query.endDate) {
      const { start, end } = parseDateRange(query.startDate, query.endDate);
      const dateFilter = {};
      if (start) dateFilter.$gte = start;
      if (end) dateFilter.$lte = end;

      // Filter against startedAt, falling back to createdAt for legacy sessions without startedAt
      filter.$or = [
        { startedAt: dateFilter },
        { startedAt: { $exists: false }, createdAt: dateFilter },
        { startedAt: null, createdAt: dateFilter },
      ];
    }

    if (query.taskId) {
      if (!mongoose.Types.ObjectId.isValid(query.taskId)) {
        throw new Error("Invalid taskId format");
      }
      filter.taskIds = query.taskId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.completionType) {
      filter.completionType = query.completionType;
    }

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .sort({ startedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("scheduleBlockId"),
      Session.countDocuments(filter),
    ]);

    // Backward compatibility: If an older session has scheduleBlockId populated but no scheduleSnapshot,
    // synthesize scheduleSnapshot so clients receive a reliable, uniform contract.
    const normalizedSessions = sessions.map((s) => {
      const obj = s.toObject ? s.toObject() : s;
      if (!obj.scheduleSnapshot && obj.scheduleBlockId) {
        obj.scheduleSnapshot = {
          scheduleBlockId: obj.scheduleBlockId._id || obj.scheduleBlockId,
          date: obj.scheduleBlockId.date || null,
          startTime: obj.scheduleBlockId.startTime || null,
          endTime: obj.scheduleBlockId.endTime || null,
          durationMinutes: obj.scheduleBlockId.durationMinutes || 0,
        };
      }
      return obj;
    });

    return {
      sessions: normalizedSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
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
