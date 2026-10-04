import sessionRepository from "../repositories/sessionRepository.js";
import scheduleBlockRepository from "../repositories/scheduleBlockRepository.js";
import taskRepository from "../repositories/taskRepository.js";
import taskOccurrenceRepository from "../repositories/taskOccurrenceRepository.js";
import TaskOccurrenceService from "./taskOccurrenceService.js";
import TaskService from "./taskService.js";
import {
  parseDateRange,
  resolveUserTimezone,
  getProductDate,
  toStartOfDayUTC,
} from "../utils/dateUtils.js";

const startLocks = new Map();

class SessionService {
  async start(userId, payload) {
    const userKey = userId?.toString ? userId.toString() : String(userId);
    let wasConcurrent = false;
    while (startLocks.has(userKey)) {
      wasConcurrent = true;
      try {
        await startLocks.get(userKey);
      } catch {
        break;
      }
    }

    let releaseLock;
    const lockPromise = new Promise((resolve) => {
      releaseLock = resolve;
    });
    startLocks.set(userKey, lockPromise);

    try {
      return await this._executeStart(userId, payload, wasConcurrent);
    } finally {
      releaseLock();
      if (startLocks.get(userKey) === lockPromise) {
        startLocks.delete(userKey);
      }
    }
  }

  async _executeStart(userId, payload, wasConcurrent = false) {
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
      resolvedScheduleBlock = await scheduleBlockRepository.findById(scheduleBlockId);

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
      const task = await taskRepository.findById(userId, resolvedScheduleBlock.taskId);

      if (!task) {
        throw new Error("Associated task not found or access denied");
      }

      effectivePlannedDuration = resolvedScheduleBlock.durationMinutes * 60;

      const taskIdStr = String(resolvedScheduleBlock.taskId);
      const existingTaskIdStrs = (effectiveTaskIds || []).map((id) => String(id));
      if (!existingTaskIdStrs.includes(taskIdStr)) {
        effectiveTaskIds = [resolvedScheduleBlock.taskId, ...effectiveTaskIds];
      }
    }

    // 1. If exact requested session already exists and is active, return it
    const oldSession = await this.getSession(userId, sessionId);
    if (oldSession && oldSession.status === "active") return oldSession;

    // 2. Concurrency guard: if another start call was in flight concurrently for this user
    if (wasConcurrent) {
      const activeSession = await sessionRepository.findActiveSession(userId).catch(() => null);
      if (activeSession) {
        return activeSession;
      }
    }

    return await sessionRepository.create(
      userId,
      {
        ...payload,
        plannedDuration: effectivePlannedDuration,
        taskIds: effectiveTaskIds,
      },
      resolvedScheduleBlock
    );
  }

  async getSession(userId, sessionId) {
    return await sessionRepository.findByClientSessionId(userId, sessionId);
  }

  async update(userId, payload) {
    const { sessionId } = payload;
    if (!sessionId) {
      throw new Error("Session id required");
    }

    const pgResult = await sessionRepository.update(userId, sessionId, payload);
    if (pgResult && pgResult.session) {
      return pgResult;
    }

    throw new Error("Session not found");
  }

  async checkpointProgress(userId, payload) {
    const { sessionId } = payload;
    if (!sessionId) {
      const err = new Error("Session ID is required");
      err.statusCode = 400;
      throw err;
    }

    const session = await sessionRepository.checkpoint(userId, sessionId, payload);
    if (!session) {
      const err = new Error("Session not found or access denied");
      err.statusCode = 404;
      throw err;
    }

    return session;
  }

  async feedback(userId, payload) {
    const { sessionId, feedback, timezone } = payload;
    let targetSession = await this.getSession(userId, sessionId);
    if (!targetSession) {
      const err = new Error("Session not found");
      err.statusCode = 404;
      throw err;
    }

    const taskOutcome =
      payload.taskOutcome ||
      payload.sessionTaskOutcome ||
      feedback?.taskOutcome ||
      feedback?.sessionTaskOutcome;

    if (taskOutcome) {
      await this.recordTaskOutcome(userId, {
        sessionId,
        taskOutcome,
        timezone,
      });
    }

    if (feedback) {
      const pgFeedback = await sessionRepository.recordFeedback(userId, sessionId, feedback);
      if (pgFeedback) return pgFeedback;
    }

    return targetSession;
  }

  async recordTaskOutcome(userId, payload) {
    const { sessionId, taskOutcome, timezone, asOfDate } = payload;
    if (!sessionId) {
      const err = new Error("sessionId is required");
      err.statusCode = 400;
      throw err;
    }

    const validOutcomes = ["completed", "partially_completed", "not_completed"];
    if (!validOutcomes.includes(taskOutcome)) {
      const err = new Error(`Invalid task outcome. Allowed: ${validOutcomes.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    const session = await this.getSession(userId, sessionId);
    if (!session) {
      const err = new Error("Session not found or access denied");
      err.statusCode = 404;
      throw err;
    }

    const effectiveTaskIds = (session.taskIds || []).map((id) => String(id));
    let singleTaskId = null;
    if (effectiveTaskIds.length === 1) {
      singleTaskId = effectiveTaskIds[0];
    } else if (effectiveTaskIds.length === 0 && session.scheduleBlockId?.taskId) {
      singleTaskId = String(session.scheduleBlockId.taskId);
    }

    if (!singleTaskId || effectiveTaskIds.length > 1) {
      return session;
    }

    await sessionRepository.recordTaskOutcome(userId, sessionId, taskOutcome);
    session.sessionTaskOutcome = taskOutcome;

    const tz = timezone || (await resolveUserTimezone(userId));
    const asOf = asOfDate || session.endedAt || session.startedAt || new Date();
    const currentProductDate = getProductDate(asOf, tz);
    const currentNormalizedDate = toStartOfDayUTC(currentProductDate, "UTC");

    let targetOcc = await taskOccurrenceRepository.findUserTaskOccurrenceOnDate(
      userId,
      singleTaskId,
      currentProductDate
    );
    if (!targetOcc) {
      const occurrence = await TaskOccurrenceService.getOccurrences(
        userId,
        { date: currentProductDate, taskId: singleTaskId },
        tz
      );
      targetOcc = occurrence?.[0] || null;
    }

    const task = await taskRepository.findById(userId, singleTaskId);

    if (!targetOcc) {
      if (taskOutcome === "completed") {
        if (task && (task.plannedDate || task.plannedProductDate) && getProductDate(task.plannedProductDate || task.plannedDate, tz) === currentProductDate) {
          await TaskOccurrenceService.ensureOccurrence(
            userId,
            {
              taskId: singleTaskId,
              date: currentNormalizedDate,
              productDate: currentProductDate,
              outcome: "completed",
              taskSnapshot: { title: task.title, priority: task.priority },
            },
            tz
          );
        }
        if (task && task.status !== "completed") {
          await TaskService.updateTask(userId, singleTaskId, { status: "completed" }, asOf, tz);
        }
      } else if (taskOutcome === "partially_completed") {
        if (task && (task.plannedDate || task.plannedProductDate) && getProductDate(task.plannedProductDate || task.plannedDate, tz) === currentProductDate) {
          await TaskOccurrenceService.ensureOccurrence(
            userId,
            {
              taskId: singleTaskId,
              date: currentNormalizedDate,
              productDate: currentProductDate,
              outcome: "partially_completed",
              taskSnapshot: { title: task.title, priority: task.priority },
            },
            tz
          );
        }
      }
      return session;
    }

    const occId = targetOcc.id || targetOcc._id;
    if (["rescheduled", "cancelled", "missed"].includes(targetOcc.outcome)) {
      return session;
    }

    if (targetOcc.outcome === "completed") {
      if (taskOutcome === "completed" && task && task.status !== "completed") {
        await TaskService.updateTask(userId, singleTaskId, { status: "completed" }, asOf, tz);
      }
      return session;
    }

    if (targetOcc.outcome === "partially_completed" || targetOcc.outcome === "pending") {
      if (taskOutcome === "completed") {
        await TaskOccurrenceService.recordOutcome(userId, occId, {
          outcome: "completed",
          completedAt: asOf,
        });
        if (task && task.status !== "completed") {
          await TaskService.updateTask(userId, singleTaskId, { status: "completed" }, asOf, tz);
        }
      } else if (taskOutcome === "partially_completed") {
        await TaskOccurrenceService.recordOutcome(userId, occId, {
          outcome: "partially_completed",
        });
      }
    }

    return session;
  }

  async activeSessions(userId) {
    if (!userId) throw new Error("User not found.");
    const latest = await sessionRepository.findActiveSession(userId);
    if (!latest) return null;

    const allSegmentsDone =
      latest.sessionSegments?.length > 0 &&
      latest.sessionSegments.every((s) => s.completedAt);

    if (allSegmentsDone) {
      await sessionRepository.update(userId, latest.sessionId || latest.clientSessionId, {
        status: "completed",
      }).catch(() => null);
      return null;
    }

    const plannedSecs = latest.plannedDuration || 1500;
    const lastActiveDate = latest.updatedAt || latest.startedAt || latest.createdAt;
    const lastActiveMs = new Date(lastActiveDate).getTime();
    const nowMs = Date.now();
    const maxInactiveMs = Math.max(plannedSecs * 1000 + 2 * 60 * 60 * 1000, 4 * 60 * 60 * 1000);

    if (nowMs - lastActiveMs > maxInactiveMs) {
      await sessionRepository.update(userId, latest.sessionId || latest.clientSessionId, {
        status: "abandoned",
      }).catch(() => null);
      return null;
    }

    return latest;
  }

  async sessions(userId) {
    if (!userId) throw new Error("User not found.");
    return await sessionRepository.findUserSessions(userId);
  }

  async history(userId, query = {}) {
    if (!userId) throw new Error("User not found.");
    return await sessionRepository.findHistory(userId, query);
  }

  async getInsights(userId, type = null) {
    return {};
  }
}

export default new SessionService();
