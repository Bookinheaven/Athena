import taskOccurrenceRepository from "../repositories/taskOccurrenceRepository.js";
import taskRepository from "../repositories/taskRepository.js";
import {
  toStartOfDayUTC,
  parseDateRange,
  getProductDate,
  productDateToStart,
  resolveUserTimezone,
} from "../utils/dateUtils.js";

class TaskOccurrenceService {
  _createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  async ensureOccurrence(userId, data, timezone = null) {
    const { taskId, date, outcome = "pending", taskSnapshot, productDate: explicitProductDate } = data;

    if (!taskId) {
      throw this._createError("taskId is required", 400);
    }
    if (!date) {
      throw this._createError("date is required", 400);
    }

    const tz = timezone || (await resolveUserTimezone(userId));
    const productDate = explicitProductDate || getProductDate(date, tz);

    let resolvedSnapshot = taskSnapshot || null;
    if (!resolvedSnapshot) {
      const task = await taskRepository.findById(userId, taskId);
      if (task) {
        resolvedSnapshot = {
          title: task.title,
          priority: task.priority || "medium",
        };
      }
    }

    return await taskOccurrenceRepository.upsert(userId, taskId, productDate, {
      outcome,
      taskSnapshot: resolvedSnapshot,
    });
  }

  async recordOutcome(userId, occurrenceId, updateData) {
    const validOutcomes = [
      "pending",
      "completed",
      "partially_completed",
      "rescheduled",
      "missed",
      "cancelled",
    ];

    const { outcome, completedAt, notes } = updateData;

    if (outcome && !validOutcomes.includes(outcome)) {
      throw this._createError(
        `Invalid outcome. Allowed: ${validOutcomes.join(", ")}`,
        400
      );
    }

    const existing = await taskOccurrenceRepository.findById(occurrenceId);
    if (!existing || String(existing.userId) !== String(userId)) {
      throw this._createError("Task occurrence not found or access denied", 404);
    }

    const setPayload = {};
    if (outcome) setPayload.outcome = outcome;
    if (notes !== undefined) setPayload.notes = notes;

    if (outcome === "completed") {
      setPayload.completedAt = completedAt ? new Date(completedAt) : new Date();
    } else if (completedAt !== undefined) {
      setPayload.completedAt = completedAt ? new Date(completedAt) : null;
    }

    const pgOccurrence = await taskOccurrenceRepository.update(occurrenceId, setPayload);
    if (!pgOccurrence) {
      throw this._createError("Task occurrence not found or access denied", 404);
    }

    return pgOccurrence;
  }

  async reschedule(userId, occurrenceId, newDate, timezone = null) {
    if (!newDate) {
      throw this._createError("newDate is required for rescheduling", 400);
    }

    const tz = timezone || (await resolveUserTimezone(userId));
    const targetProductDate = getProductDate(newDate, tz);

    const original = await taskOccurrenceRepository.findById(occurrenceId);
    if (!original || String(original.userId) !== String(userId)) {
      throw this._createError("Task occurrence not found or access denied", 404);
    }

    const originalProductDate = original.productDate || getProductDate(original.date, tz);
    if (originalProductDate === targetProductDate) {
      throw this._createError(
        "Target reschedule date must be different from original date",
        400
      );
    }

    // 1. Update original occurrence
    const updatedOriginal = await taskOccurrenceRepository.update(occurrenceId, {
      outcome: "rescheduled",
      rescheduledToDate: targetProductDate,
    });

    // 2. Ensure next occurrence
    const nextOccurrence = await taskOccurrenceRepository.upsert(
      userId,
      original.taskId,
      targetProductDate,
      {
        outcome: "pending",
        taskSnapshot: original.taskSnapshot || { title: original.snapshotTitle, priority: original.snapshotPriority },
      }
    );

    // 3. Keep Task.plannedProductDate in sync
    if (original.taskId) {
      await taskRepository.update(userId, original.taskId, {
        customPlannedDate: targetProductDate,
        plannedDate: targetProductDate,
      });
    }

    return {
      originalOccurrence: updatedOriginal,
      nextOccurrence,
    };
  }

  async syncTaskPlannedDate(userId, task, previousPlannedDate, timezone = null) {
    if (!task) return null;
    const taskId = task.id || task._id;
    if (!taskId) return null;

    const tz = timezone || (await resolveUserTimezone(userId));
    const taskSnapshot = {
      title: task.title,
      priority: task.priority || "medium",
    };

    const planned = task.customPlannedDate || task.plannedProductDate || task.plannedDate;
    if (!planned) {
      return null;
    }

    const newProductDate = task.customPlannedDate || getProductDate(planned, tz);
    const newDate = productDateToStart(newProductDate, tz);

    if (previousPlannedDate) {
      const oldProductDate = getProductDate(previousPlannedDate, tz);
      if (oldProductDate !== newProductDate) {
        const oldOcc = await taskOccurrenceRepository.findUserTaskOccurrenceOnDate(
          userId,
          taskId,
          oldProductDate
        );
        if (oldOcc && oldOcc.outcome === "pending") {
          return await this.reschedule(userId, oldOcc.id, newProductDate, tz);
        }
      }
    }

    return await this.ensureOccurrence(
      userId,
      {
        taskId,
        date: newDate,
        productDate: newProductDate,
        outcome: "pending",
        taskSnapshot,
      },
      tz
    );
  }

  async syncTaskStatus(
    userId,
    task,
    previousStatus,
    asOfDate = new Date(),
    timezone = null
  ) {
    if (!task) return null;
    const taskId = task.id || task._id;
    if (!taskId) return null;

    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(asOfDate, tz);
    const today = productDateToStart(todayProductDate, tz);

    // 1. Task Completed
    if (task.status === "completed") {
      let occurrence = await taskOccurrenceRepository.findUserTaskOccurrenceOnDate(
        userId,
        taskId,
        todayProductDate
      );

      if (!occurrence && (task.plannedDate || task.plannedProductDate || task.customPlannedDate)) {
        const pDate = task.customPlannedDate || getProductDate(task.plannedDate, tz);
        if (pDate <= todayProductDate) {
          occurrence = await taskOccurrenceRepository.findUserTaskOccurrenceOnDate(
            userId,
            taskId,
            pDate
          );
        }
      }

      if (occurrence && ["pending", "partially_completed"].includes(occurrence.outcome)) {
        return await this.recordOutcome(userId, occurrence.id || occurrence._id, {
          outcome: "completed",
          completedAt: new Date(),
        });
      } else if (
        (task.plannedProductDate === todayProductDate || task.customPlannedDate === todayProductDate)
      ) {
        return await this.ensureOccurrence(
          userId,
          {
            taskId,
            date: today,
            productDate: todayProductDate,
            outcome: "completed",
            taskSnapshot: { title: task.title, priority: task.priority },
          },
          tz
        );
      }
    }

    // 2. Task Reopened (was completed, now todo or in-progress)
    if (
      previousStatus === "completed" &&
      (task.status === "todo" || task.status === "in-progress")
    ) {
      let todayOccurrence = await taskOccurrenceRepository.findUserTaskOccurrenceOnDate(
        userId,
        taskId,
        todayProductDate
      );

      if (todayOccurrence && todayOccurrence.outcome === "completed") {
        const nextOutcome =
          task.status === "in-progress" ? "partially_completed" : "pending";
        return await this.recordOutcome(userId, todayOccurrence.id || todayOccurrence._id, {
          outcome: nextOutcome,
          completedAt: null,
        });
      }
    }

    // 3. Task Cancelled
    if (task.status === "cancelled") {
      let occurrence = await taskOccurrenceRepository.findUserTaskOccurrenceOnDate(
        userId,
        taskId,
        todayProductDate
      );

      if (!occurrence && (task.plannedDate || task.plannedProductDate)) {
        const pDate = task.customPlannedDate || getProductDate(task.plannedDate, tz);
        occurrence = await taskOccurrenceRepository.findUserTaskOccurrenceOnDate(
          userId,
          taskId,
          pDate
        );
      }

      if (occurrence && ["pending", "partially_completed"].includes(occurrence.outcome)) {
        return await this.recordOutcome(userId, occurrence.id || occurrence._id, {
          outcome: "cancelled",
        });
      }
    }

    // 4. Task Uncancelled (was cancelled, now todo or in-progress)
    if (
      previousStatus === "cancelled" &&
      (task.status === "todo" || task.status === "in-progress")
    ) {
      let todayOccurrence = await taskOccurrenceRepository.findUserTaskOccurrenceOnDate(
        userId,
        taskId,
        todayProductDate
      );

      if (todayOccurrence && todayOccurrence.outcome === "cancelled") {
        return await this.recordOutcome(userId, todayOccurrence.id || todayOccurrence._id, {
          outcome: "pending",
        });
      }
    }

    return null;
  }

  async evaluateMissedOccurrences(
    userId,
    asOfDate = new Date(),
    timezone = null
  ) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(asOfDate, tz);
    await taskOccurrenceRepository.evaluateMissedOccurrences(userId, todayProductDate);
  }

  async getOccurrences(userId, query = {}, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    await this.evaluateMissedOccurrences(userId, new Date(), tz);

    let occs = [];
    if (query.date) {
      const pDate = getProductDate(query.date, tz);
      if (query.taskId) {
        const single = await taskOccurrenceRepository.findUserTaskOccurrenceOnDate(
          userId,
          query.taskId,
          pDate
        );
        occs = single ? [single] : [];
      } else {
        occs = await taskOccurrenceRepository.findByUserAndDate(userId, pDate);
      }
    } else if (query.startDate || query.endDate) {
      const { startProductDate, endProductDate } = parseDateRange(
        query.startDate,
        query.endDate,
        tz
      );
      occs = await taskOccurrenceRepository.findByUserAndDateRange(
        userId,
        startProductDate,
        endProductDate
      );
    } else if (query.taskId) {
      occs = await taskOccurrenceRepository.findByTaskId(query.taskId);
    } else {
      occs = await taskOccurrenceRepository.findPastOccurrences(userId, "9999-12-31");
    }

    if (occs && occs.length > 0) {
      const taskIds = occs.map((o) => o.taskId).filter(Boolean);
      const taskList = await taskRepository.findByIds(userId, taskIds);
      const taskMap = new Map(taskList.map((t) => [String(t.id), t]));
      for (const occ of occs) {
        occ.taskId = taskMap.get(String(occ.taskId)) || null;
        if (!occ.taskId && occ.snapshotTitle) {
          occ.taskTitle = occ.snapshotTitle;
          occ.taskPriority = occ.snapshotPriority || "medium";
          occ.isTaskDeleted = true;
        }
      }
    }

    return occs || [];
  }

  async rolloverTasks(userId, fromProductDate, toProductDate, taskIds, timezone = null) {
    if (!userId) {
      throw this._createError("userId is required", 400);
    }
    if (!fromProductDate || typeof fromProductDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fromProductDate)) {
      throw this._createError("fromProductDate is required and must be in YYYY-MM-DD format", 400);
    }
    if (!toProductDate || typeof toProductDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(toProductDate)) {
      throw this._createError("toProductDate is required and must be in YYYY-MM-DD format", 400);
    }
    if (toProductDate <= fromProductDate) {
      throw this._createError("toProductDate must be strictly after fromProductDate", 400);
    }
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw this._createError("taskIds array with at least one task ID is required", 400);
    }

    const tz = timezone || (await resolveUserTimezone(userId));

    const result = await taskOccurrenceRepository.rolloverBatch(
      userId,
      fromProductDate,
      toProductDate,
      taskIds
    );

    if (result.rolledOver && result.rolledOver.length > 0) {
      try {
        const { default: StreakService } = await import("./streakService.js");
        const fromStart = productDateToStart(fromProductDate, tz);
        const toStart = productDateToStart(toProductDate, tz);
        await StreakService.processDailyStreak(userId, fromStart, tz);
        await StreakService.processDailyStreak(userId, toStart, tz);
      } catch (err) {
        console.error("Streak recalculation error after rollover:", err);
      }
    }

    return result;
  }
}

export default new TaskOccurrenceService();
