import sessionRepository from "../repositories/sessionRepository.js";
import scheduleBlockRepository from "../repositories/scheduleBlockRepository.js";
import taskRepository from "../repositories/taskRepository.js";
import taskOccurrenceRepository from "../repositories/taskOccurrenceRepository.js";
import TaskOccurrenceService from "./taskOccurrenceService.js";
import TaskService from "./taskService.js";
import streakService from "./streakService.js";
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
    const { sessionId, feedback, timezone, asOfDate } = payload;
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

    const taskOutcomes =
      payload.taskOutcomes ||
      feedback?.taskOutcomes;

    if (taskOutcome || taskOutcomes) {
      await this.recordTaskOutcome(userId, {
        sessionId,
        taskOutcome,
        taskOutcomes,
        timezone,
        asOfDate: asOfDate || feedback?.asOfDate,
      });
    }

    if (feedback) {
      const pgFeedback = await sessionRepository.recordFeedback(userId, sessionId, feedback);
      if (pgFeedback) return pgFeedback;
    }

    return targetSession;
  }

  async recordTaskOutcome(userId, payload) {
    const { sessionId, taskOutcome, taskOutcomes, timezone, asOfDate } = payload;
    if (!sessionId) {
      const err = new Error("sessionId is required");
      err.statusCode = 400;
      throw err;
    }

    const validOutcomes = ["completed", "partially_completed", "not_completed"];

    const session = await this.getSession(userId, sessionId);
    if (!session) {
      const err = new Error("Session not found or access denied");
      err.statusCode = 404;
      throw err;
    }

    const effectiveTaskIds = (session.taskIds || []).map((id) => String(id));
    let fallbackSingleTaskId = null;
    if (effectiveTaskIds.length === 1) {
      fallbackSingleTaskId = effectiveTaskIds[0];
    } else if (effectiveTaskIds.length === 0 && session.scheduleBlockId?.taskId) {
      fallbackSingleTaskId = String(session.scheduleBlockId.taskId);
    }

    // Build normalized task outcomes list: [{ taskId, outcome }]
    let normalizedEntries = [];

    if (taskOutcomes && typeof taskOutcomes === "object") {
      if (Array.isArray(taskOutcomes)) {
        normalizedEntries = taskOutcomes
          .map((item) => ({
            taskId: String(item.taskId || item.id || ""),
            outcome: item.outcome || item.taskOutcome,
          }))
          .filter((entry) => entry.taskId && validOutcomes.includes(entry.outcome));
      } else {
        normalizedEntries = Object.entries(taskOutcomes)
          .map(([tId, val]) => ({
            taskId: String(tId),
            outcome: typeof val === "object" ? (val?.outcome || val?.taskOutcome) : val,
          }))
          .filter((entry) => entry.taskId && validOutcomes.includes(entry.outcome));
      }
    }

    // If no explicit taskOutcomes entries, but single taskOutcome is provided
    if (normalizedEntries.length === 0 && taskOutcome) {
      if (!validOutcomes.includes(taskOutcome)) {
        const err = new Error(`Invalid task outcome. Allowed: ${validOutcomes.join(", ")}`);
        err.statusCode = 400;
        throw err;
      }
      if (fallbackSingleTaskId) {
        normalizedEntries.push({ taskId: fallbackSingleTaskId, outcome: taskOutcome });
      } else if (effectiveTaskIds.length > 0) {
        normalizedEntries = effectiveTaskIds.map((tId) => ({ taskId: tId, outcome: taskOutcome }));
      }
    }

    // Zero linked tasks edge case: nothing to update on tasks/occurrences
    if (normalizedEntries.length === 0) {
      return session;
    }

    const tz = timezone || (await resolveUserTimezone(userId));
    const asOf = asOfDate || session.endedAt || session.startedAt || new Date();
    const currentProductDate = getProductDate(asOf, tz);
    const currentNormalizedDate = toStartOfDayUTC(currentProductDate, "UTC");

    for (const { taskId, outcome } of normalizedEntries) {
      const task = await taskRepository.findById(userId, taskId);
      if (!task) continue;

      let targetOcc = await taskOccurrenceRepository.findUserTaskOccurrenceOnDate(
        userId,
        taskId,
        currentProductDate
      );
      if (!targetOcc) {
        const occurrence = await TaskOccurrenceService.getOccurrences(
          userId,
          { date: currentProductDate, taskId },
          tz
        );
        targetOcc = occurrence?.[0] || null;
      }

      if (!targetOcc) {
        if (outcome === "completed") {
          if (
            task &&
            (task.plannedDate || task.plannedProductDate) &&
            getProductDate(task.plannedProductDate || task.plannedDate, tz) === currentProductDate
          ) {
            await TaskOccurrenceService.ensureOccurrence(
              userId,
              {
                taskId,
                date: currentNormalizedDate,
                productDate: currentProductDate,
                outcome: "completed",
                taskSnapshot: { title: task.title, priority: task.priority },
              },
              tz
            );
          }
          if (task && task.status !== "completed") {
            await TaskService.updateTask(userId, taskId, { status: "completed" }, asOf, tz);
          }
        } else if (outcome === "partially_completed") {
          if (
            task &&
            (task.plannedDate || task.plannedProductDate || task.customPlannedDate) &&
            getProductDate(task.plannedProductDate || task.customPlannedDate || task.plannedDate, tz) === currentProductDate
          ) {
            await TaskOccurrenceService.ensureOccurrence(
              userId,
              {
                taskId,
                date: currentNormalizedDate,
                productDate: currentProductDate,
                outcome: "partially_completed",
                taskSnapshot: { title: task.title, priority: task.priority },
              },
              tz
            );
            if (task && task.status === "todo") {
              await TaskService.updateTask(userId, taskId, { status: "in-progress" }, asOf, tz);
            }
          }
        }
        continue;
      }

      const occId = targetOcc.id || targetOcc._id;
      if (["rescheduled", "cancelled", "missed"].includes(targetOcc.outcome)) {
        continue;
      }

      if (targetOcc.outcome === "completed") {
        if (outcome === "completed" && task && task.status !== "completed") {
          await TaskService.updateTask(userId, taskId, { status: "completed" }, asOf, tz);
        }
        continue;
      }

      if (targetOcc.outcome === "partially_completed" || targetOcc.outcome === "pending") {
        if (outcome === "completed") {
          await TaskOccurrenceService.recordOutcome(userId, occId, {
            outcome: "completed",
            completedAt: asOf,
          });
          if (task && task.status !== "completed") {
            await TaskService.updateTask(userId, taskId, { status: "completed" }, asOf, tz);
          }
        } else if (outcome === "partially_completed") {
          await TaskOccurrenceService.recordOutcome(userId, occId, {
            outcome: "partially_completed",
          });
          if (task && task.status === "todo") {
            await TaskService.updateTask(userId, taskId, { status: "in-progress" }, asOf, tz);
          }
        }
        // not_completed leaves occurrence as pending
      }
    }

    // Determine overall sessionTaskOutcome
    let aggregateOutcome = "not_completed";
    const allOutcomes = normalizedEntries.map((e) => e.outcome);
    if (allOutcomes.length > 0 && allOutcomes.every((o) => o === "completed")) {
      aggregateOutcome = "completed";
    } else if (allOutcomes.some((o) => o === "completed" || o === "partially_completed")) {
      aggregateOutcome = "partially_completed";
    } else {
      aggregateOutcome = "not_completed";
    }

    if (normalizedEntries.length === 1 && taskOutcome && validOutcomes.includes(taskOutcome)) {
      aggregateOutcome = taskOutcome;
    }

    await sessionRepository.recordTaskOutcome(userId, sessionId, aggregateOutcome);
    session.sessionTaskOutcome = aggregateOutcome;

    try {
      await streakService.processDailyStreak(userId, asOf, tz);
    } catch (err) {
      console.error("[sessionService] Failed to process streak on recordTaskOutcome:", err);
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
