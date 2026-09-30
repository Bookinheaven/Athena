import { getStartOfDay } from "../utils/streakHelpers.js";
import GoalService from "./goalService.js";
import Task from "../models/taskModel.js";
import ScheduleBlock from "../models/scheduleBlockModel.js";
import TaskOccurrenceService from "./taskOccurrenceService.js";
import streakService from "./streakService.js";
import {
  isValidTimezone,
  getProductDate,
  productDateToStart,
  resolveUserTimezone,
} from "../utils/dateUtils.js";

class TaskService {
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

    const task = await Task.create({
      ...safeData,
      user: userId,
    });

    if (task.goal) {
      await GoalService.recalculateProgress(task.goal);
    }

    if (task.plannedDate) {
      try {
        await TaskOccurrenceService.syncTaskPlannedDate(
          userId,
          task,
          null,
          tz
        );
        await streakService.processDailyStreak(userId, asOfDate, tz);
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
    const today = getStartOfDay();

    const tasks = await Task.find({
      user: userId,
    }).sort({ order: 1 });
    return tasks;
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

    const existingTask = await Task.findOne({ _id: taskId, user: userId });
    if (!existingTask) {
      throw new Error("Task not found or access denied");
    }

    const previousPlannedDate = existingTask.plannedDate;
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

    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: userId },
      { $set: updateData },
      { new: true }
    );

    if (task?.goal) {
      await GoalService.recalculateProgress(task.goal);
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

  async deleteTask(userId, taskId) {
    const task = await Task.findOneAndDelete({
      _id: taskId,
      user: userId,
    });

    if (task) {
      await ScheduleBlock.deleteMany({ taskId, userId });
    }

    if (task?.goal) {
      await GoalService.recalculateProgress(task.goal);
    }

    // Per Requirement 3 & 18K:
    // Deleting a Task must NOT delete historical TaskOccurrences!
    // Historical occurrences preserve taskSnapshot so day-planning records remain valid.

    return task;
  }

  async reorderTasks(userId, updates) {
    const bulkOps = updates.map((u) => ({
      updateOne: {
        filter: { _id: u.taskId, user: userId },
        update: { order: u.order },
      },
    }));

    await Task.bulkWrite(bulkOps);
  }
}

export default new TaskService();