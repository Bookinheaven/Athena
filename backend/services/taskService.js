import taskRepository, { normalizeTaskId } from "../repositories/taskRepository.js";
import scheduleBlockRepository from "../repositories/scheduleBlockRepository.js";
import taskOccurrenceRepository from "../repositories/taskOccurrenceRepository.js";
import sessionRepository from "../repositories/sessionRepository.js";
import GoalService from "./goalService.js";
import TaskOccurrenceService from "./taskOccurrenceService.js";
import streakService from "./streakService.js";
import {
  isValidTimezone,
  getProductDate,
  productDateToStart,
  resolveUserTimezone,
} from "../utils/dateUtils.js";
import { computeTaskFriction } from "../utils/taskFrictionEngine.js";

class TaskService {
  constructor(deps = {}) {
    this.taskRepo = deps.taskRepository || taskRepository;
    this.taskOccurrenceRepo = deps.taskOccurrenceRepository || taskOccurrenceRepository;
    this.sessionRepo = deps.sessionRepository || sessionRepository;
  }

  async createTask(userId, data, asOfDateOrTimezone = new Date(), timezone = null) {
    let asOfDate = asOfDateOrTimezone;
    let tz = timezone;
    if (typeof asOfDateOrTimezone === "string" && isValidTimezone(asOfDateOrTimezone)) {
      tz = asOfDateOrTimezone;
      asOfDate = new Date();
    }
    tz = tz || (await resolveUserTimezone(userId));

    const { user, _id, ...safeData } = data;

    // Normalize plannedDate and customPlannedDate if provided
    let plannedProductDate = null;
    if (safeData.customPlannedDate) {
      plannedProductDate = getProductDate(safeData.customPlannedDate, tz);
      safeData.customPlannedDate = plannedProductDate;
      safeData.plannedDate = productDateToStart(plannedProductDate, tz);
    } else if (safeData.plannedDate) {
      plannedProductDate = getProductDate(safeData.plannedDate, tz);
      safeData.customPlannedDate = plannedProductDate;
      safeData.plannedDate = productDateToStart(plannedProductDate, tz);
    }

    const task = await taskRepository.create(userId, safeData);

    const goalId = task.goalId || task.goal;
    if (goalId) {
      await GoalService.recalculateProgress(goalId);
    }

    if (task.plannedDate || task.plannedProductDate || task.customPlannedDate) {
      try {
        await TaskOccurrenceService.syncTaskPlannedDate(
          userId,
          task,
          null,
          tz
        );
      } catch (err) {
        console.error(
          "[taskService] Failed to sync TaskOccurrence on createTask:",
          err
        );
      }
    }

    return task;
  }

  async getTasks(userId) {
    return taskRepository.findByUserId(userId);
  }

  async updateTask(userId, taskId, data, asOfDateOrTimezone = new Date(), timezone = null) {
    let asOfDate = asOfDateOrTimezone;
    let tz = timezone;
    if (typeof asOfDateOrTimezone === "string" && isValidTimezone(asOfDateOrTimezone)) {
      tz = asOfDateOrTimezone;
      asOfDate = new Date();
    }
    tz = tz || (await resolveUserTimezone(userId));

    const { user, _id, ...updateData } = data;

    if (!normalizeTaskId(taskId)) {
      const err = new Error("Invalid task ID format");
      err.statusCode = 400;
      throw err;
    }

    const existingTask = await taskRepository.findById(userId, taskId);
    if (!existingTask) {
      const err = new Error("Task not found or access denied");
      err.statusCode = 404;
      throw err;
    }

    const previousPlannedDate = existingTask.plannedDate || existingTask.plannedProductDate;
    const previousStatus = existingTask.status;

    // Normalize plannedDate and customPlannedDate if updating
    if (updateData.customPlannedDate !== undefined) {
      if (updateData.customPlannedDate) {
        const pDate = getProductDate(updateData.customPlannedDate, tz);
        updateData.customPlannedDate = pDate;
        updateData.plannedDate = productDateToStart(pDate, tz);
      } else {
        updateData.customPlannedDate = null;
        updateData.plannedDate = null;
      }
    } else if (updateData.plannedDate !== undefined) {
      if (updateData.plannedDate) {
        const pDate = getProductDate(updateData.plannedDate, tz);
        updateData.customPlannedDate = pDate;
        updateData.plannedDate = productDateToStart(pDate, tz);
      } else {
        updateData.customPlannedDate = null;
        updateData.plannedDate = null;
      }
    }

    const task = await taskRepository.update(userId, taskId, updateData);
    if (!task) {
      const err = new Error("Task not found");
      err.statusCode = 404;
      throw err;
    }

    const goalId = task?.goalId || task?.goal;
    if (goalId) {
      await GoalService.recalculateProgress(goalId);
    }

    // 1. Sync plannedDate change or rescheduling
    if (updateData.plannedDate !== undefined || updateData.customPlannedDate !== undefined) {
      try {
        await TaskOccurrenceService.syncTaskPlannedDate(
          userId,
          task,
          previousPlannedDate,
          tz
        );
      } catch (err) {
        console.error(
          "[taskService] Failed to sync TaskOccurrence plannedDate:",
          err
        );
      }
    }

    // 2. Sync task status changes (completed, cancelled, reopened)
    if (updateData.status && updateData.status !== previousStatus) {
      try {
        await TaskOccurrenceService.syncTaskStatus(
          userId,
          task,
          previousStatus,
          asOfDate,
          tz
        );
      } catch (err) {
        console.error(
          "[taskService] Failed to sync TaskOccurrence status:",
          err
        );
      }
    }

    if (
      updateData.status === "completed" ||
      updateData.plannedDate !== undefined ||
      updateData.customPlannedDate !== undefined
    ) {
      try {
        await streakService.processDailyStreak(userId, asOfDate, tz);
      } catch (err) {
        console.error(
          "[taskService] Failed to recalculate streak on updateTask:",
          err
        );
      }
    }

    return task;
  }

  async deleteTask(userId, taskId, asOfDate = new Date(), timezone = null) {
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanTaskId) {
      const err = new Error("Invalid task ID format");
      err.statusCode = 400;
      throw err;
    }

    // 1. Verify task belongs to user
    const task = await taskRepository.findById(userId, cleanTaskId);
    if (!task) {
      const err = new Error("Task not found");
      err.statusCode = 404;
      throw err;
    }

    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(asOfDate, tz);

    // 2. Check for historical session execution
    const hasSessions = await sessionRepository.hasSessionsForTask(cleanTaskId);
    if (hasSessions) {
      const err = new Error("Task cannot be deleted because it has historical focus session records.");
      err.statusCode = 409;
      throw err;
    }

    // 3. Check for historical task occurrences (completed, rescheduled, missed, past dates)
    const hasHistoricalOccurrences = await taskOccurrenceRepository.hasHistoricalOccurrences(
      userId,
      cleanTaskId,
      todayProductDate
    );
    if (hasHistoricalOccurrences) {
      const err = new Error("Task cannot be deleted because it has historical planning records.");
      err.statusCode = 409;
      throw err;
    }

    // 4. Safe deletion: cleanup unexecuted pending occurrences and unstarted schedule blocks
    await taskOccurrenceRepository.deletePendingByTaskId(userId, cleanTaskId);
    await scheduleBlockRepository.deleteByTaskId(userId, cleanTaskId);

    // 5. Delete task
    const pgDeleted = await taskRepository.delete(userId, cleanTaskId);
    if (pgDeleted) {
      if (pgDeleted.goalId) {
        await GoalService.recalculateProgress(pgDeleted.goalId);
      }
      try {
        await streakService.processDailyStreak(userId, asOfDate, tz);
      } catch (err) {
        console.error("Failed to recalculate streak on deleteTask:", err);
      }
      return pgDeleted;
    }

    const err = new Error("Task not found");
    err.statusCode = 404;
    throw err;
  }

  async reorderTasks(userId, updates) {
    await taskRepository.reorder(userId, updates);
  }

  async getTaskFriction(userId, taskId) {
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanTaskId) {
      const error = new Error("Invalid taskId format");
      error.status = 400;
      error.statusCode = 400;
      throw error;
    }

    const task = await (this.taskRepo || taskRepository).findById(userId, cleanTaskId);
    if (!task) {
      const error = new Error("Task not found or access denied");
      error.status = 404;
      error.statusCode = 404;
      throw error;
    }

    const occurrences = await (this.taskOccurrenceRepo || taskOccurrenceRepository).findByUserAndTaskId(
      userId,
      cleanTaskId
    );
    const focusSeconds = await (this.sessionRepo || sessionRepository).getFocusSecondsForTask(
      userId,
      cleanTaskId
    );

    return computeTaskFriction({
      task,
      occurrences,
      focusSeconds,
    });
  }
}

export { TaskService };
export default new TaskService();