import mongoose from "mongoose";
import TaskOccurrence from "../models/taskOccurrenceModel.js";
import Task from "../models/taskModel.js";
import {
  toStartOfDayUTC,
  parseDateRange,
  isSameDay,
  getProductDate,
  productDateToStart,
  resolveUserTimezone,
} from "../utils/dateUtils.js";

class TaskOccurrenceService {
  /**
   * Helper to create typed operational errors
   */
  _createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  /**
   * Ensure or create a task occurrence for a specific calendar date in user's timezone.
   *
   * @param {string | mongoose.Types.ObjectId} userId
   * @param {object} data
   * @param {string | mongoose.Types.ObjectId} data.taskId
   * @param {Date | string} data.date
   * @param {string} [data.outcome="pending"]
   * @param {object} [data.taskSnapshot]
   * @param {string} [timezone]
   * @returns {Promise<TaskOccurrence>}
   */
  async ensureOccurrence(userId, data, timezone = null) {
    const { taskId, date, outcome = "pending", taskSnapshot, productDate: explicitProductDate } = data;

    if (!taskId) {
      throw this._createError("taskId is required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw this._createError("Invalid taskId format", 400);
    }
    if (!date) {
      throw this._createError("date is required", 400);
    }

    const tz = timezone || (await resolveUserTimezone(userId));
    const productDate = explicitProductDate || getProductDate(date, tz);
    const normalizedDate = toStartOfDayUTC(productDate, "UTC");

    let resolvedSnapshot = taskSnapshot || null;
    if (!resolvedSnapshot) {
      const task = await Task.findOne({ _id: taskId, user: userId });
      if (task) {
        resolvedSnapshot = {
          title: task.title,
          priority: task.priority || "medium",
        };
      }
    }

    const occurrence = await TaskOccurrence.findOneAndUpdate(
      { userId, taskId, date: normalizedDate },
      {
        $setOnInsert: {
          userId,
          taskId,
          date: normalizedDate,
          outcome,
          taskSnapshot: resolvedSnapshot,
        },
        $set: {
          productDate,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return occurrence;
  }

  /**
   * Record or update the outcome of a planned task occurrence.
   *
   * @param {string | mongoose.Types.ObjectId} userId
   * @param {string | mongoose.Types.ObjectId} occurrenceId
   * @param {object} updateData
   * @param {string} [updateData.outcome]
   * @param {Date} [updateData.completedAt]
   * @param {string} [updateData.notes]
   * @returns {Promise<TaskOccurrence>}
   */
  async recordOutcome(userId, occurrenceId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(occurrenceId)) {
      throw this._createError("Invalid occurrenceId format", 400);
    }

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

    const setPayload = {};
    if (outcome) setPayload.outcome = outcome;
    if (notes !== undefined) setPayload.notes = notes;

    if (outcome === "completed") {
      setPayload.completedAt = completedAt ? new Date(completedAt) : new Date();
    } else if (completedAt !== undefined) {
      setPayload.completedAt = completedAt ? new Date(completedAt) : null;
    }

    const occurrence = await TaskOccurrence.findOneAndUpdate(
      { _id: occurrenceId, userId },
      { $set: setPayload },
      { new: true, runValidators: true }
    );

    if (!occurrence) {
      throw this._createError("Task occurrence not found or access denied", 404);
    }

    return occurrence;
  }

  /**
   * Reschedule a task occurrence to a new date in user's timezone.
   *
   * Preserves historical truth:
   * 1. Marks original occurrence as "rescheduled" with rescheduledTo: newDate
   * 2. Creates/ensures next occurrence for newDate with outcome "pending"
   * 3. Syncs underlying Task.plannedDate
   *
   * @param {string | mongoose.Types.ObjectId} userId
   * @param {string | mongoose.Types.ObjectId} occurrenceId
   * @param {Date | string} newDate
   * @param {string} [timezone]
   * @returns {Promise<{ originalOccurrence: TaskOccurrence, nextOccurrence: TaskOccurrence }>}
   */
  async reschedule(userId, occurrenceId, newDate, timezone = null) {
    if (!mongoose.Types.ObjectId.isValid(occurrenceId)) {
      throw this._createError("Invalid occurrenceId format", 400);
    }
    if (!newDate) {
      throw this._createError("newDate is required for rescheduling", 400);
    }

    const tz = timezone || (await resolveUserTimezone(userId));
    const targetProductDate = getProductDate(newDate, tz);
    const targetDate = toStartOfDayUTC(targetProductDate, "UTC");

    const original = await TaskOccurrence.findOne({
      _id: occurrenceId,
      userId,
    });

    if (!original) {
      throw this._createError("Task occurrence not found or access denied", 404);
    }

    const originalProductDate =
      original.productDate || getProductDate(original.date, tz);
    if (originalProductDate === targetProductDate) {
      throw this._createError(
        "Target reschedule date must be different from original date",
        400
      );
    }

    // 1. Update original occurrence
    original.outcome = "rescheduled";
    original.rescheduledTo = targetDate;
    if (!original.productDate) {
      original.productDate = originalProductDate;
    }
    await original.save();

    // 2. Create/ensure next occurrence
    const nextOccurrence = await TaskOccurrence.findOneAndUpdate(
      { userId, taskId: original.taskId, date: targetDate },
      {
        $setOnInsert: {
          userId,
          taskId: original.taskId,
          date: targetDate,
          outcome: "pending",
          taskSnapshot: original.taskSnapshot,
        },
        $set: {
          productDate: targetProductDate,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    // 3. Keep Task.plannedDate in sync
    if (original.taskId) {
      await Task.findOneAndUpdate(
        { _id: original.taskId, user: userId },
        {
          $set: {
            plannedDate: productDateToStart(targetProductDate, tz),
            customPlannedDate: targetProductDate,
          },
        }
      );
    }

    return {
      originalOccurrence: original,
      nextOccurrence,
    };
  }

  /**
   * Synchronize planned date changes on Task to TaskOccurrence.
   *
   * @param {string | mongoose.Types.ObjectId} userId
   * @param {object} task
   * @param {Date | string | null} [previousPlannedDate]
   * @param {string} [timezone]
   * @returns {Promise<TaskOccurrence | object | null>}
   */
  async syncTaskPlannedDate(userId, task, previousPlannedDate, timezone = null) {
    if (!task || !task._id) return null;

    const tz = timezone || (await resolveUserTimezone(userId));
    const taskSnapshot = {
      title: task.title,
      priority: task.priority || "medium",
    };

    const planned = task.customPlannedDate || task.plannedDate;
    if (!planned) {
      return null;
    }

    const newProductDate = task.customPlannedDate
      ? task.customPlannedDate
      : getProductDate(task.plannedDate, tz);
    const newDate = toStartOfDayUTC(newProductDate, "UTC");

    if (previousPlannedDate) {
      const oldProductDate = getProductDate(previousPlannedDate, tz);
      if (oldProductDate !== newProductDate) {
        const oldDate = toStartOfDayUTC(oldProductDate, "UTC");
        const oldOccurrence = await TaskOccurrence.findOne({
          userId,
          taskId: task._id,
          $or: [{ date: oldDate }, { productDate: oldProductDate }],
        });

        if (oldOccurrence && oldOccurrence.outcome === "pending") {
          return await this.reschedule(userId, oldOccurrence._id, newDate, tz);
        }
      }
    }

    return await this.ensureOccurrence(
      userId,
      {
        taskId: task._id,
        date: newDate,
        productDate: newProductDate,
        outcome: "pending",
        taskSnapshot,
      },
      tz
    );
  }

  /**
   * Synchronize Task status transitions (completed, cancelled, reopened) with TaskOccurrence.
   *
   * @param {string | mongoose.Types.ObjectId} userId
   * @param {object} task
   * @param {string} [previousStatus]
   * @param {Date | string} [asOfDate=new Date()]
   * @param {string} [timezone]
   * @returns {Promise<TaskOccurrence | null>}
   */
  async syncTaskStatus(
    userId,
    task,
    previousStatus,
    asOfDate = new Date(),
    timezone = null
  ) {
    if (!task || !task._id) return null;

    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(asOfDate, tz);
    const today = toStartOfDayUTC(todayProductDate, "UTC");

    // 1. Task Completed
    if (task.status === "completed") {
      let occurrence = await TaskOccurrence.findOne({
        userId,
        taskId: task._id,
        $or: [{ date: today }, { productDate: todayProductDate }],
        outcome: { $in: ["pending", "partially_completed"] },
      });

      if (!occurrence && task.plannedDate) {
        const taskProductDate = getProductDate(task.plannedDate, tz);
        if (taskProductDate <= todayProductDate) {
          occurrence = await TaskOccurrence.findOne({
            userId,
            taskId: task._id,
            $or: [
              { date: toStartOfDayUTC(taskProductDate, "UTC") },
              { productDate: taskProductDate },
            ],
            outcome: { $in: ["pending", "partially_completed"] },
          });
        }
      }

      if (occurrence) {
        return await this.recordOutcome(userId, occurrence._id, {
          outcome: "completed",
          completedAt: new Date(),
        });
      } else if (
        task.plannedDate &&
        getProductDate(task.plannedDate, tz) === todayProductDate
      ) {
        return await this.ensureOccurrence(
          userId,
          {
            taskId: task._id,
            date: today,
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
      const todayOccurrence = await TaskOccurrence.findOne({
        userId,
        taskId: task._id,
        $or: [{ date: today }, { productDate: todayProductDate }],
        outcome: "completed",
      });

      if (todayOccurrence) {
        const nextOutcome =
          task.status === "in-progress" ? "partially_completed" : "pending";
        return await this.recordOutcome(userId, todayOccurrence._id, {
          outcome: nextOutcome,
          completedAt: null,
        });
      }
    }

    // 3. Task Cancelled
    if (task.status === "cancelled") {
      let occurrence = await TaskOccurrence.findOne({
        userId,
        taskId: task._id,
        $or: [{ date: today }, { productDate: todayProductDate }],
        outcome: { $in: ["pending", "partially_completed"] },
      });

      if (!occurrence && task.plannedDate) {
        const taskProductDate = getProductDate(task.plannedDate, tz);
        occurrence = await TaskOccurrence.findOne({
          userId,
          taskId: task._id,
          $or: [
            { date: toStartOfDayUTC(taskProductDate, "UTC") },
            { productDate: taskProductDate },
          ],
          outcome: { $in: ["pending", "partially_completed"] },
        });
      }

      if (occurrence) {
        return await this.recordOutcome(userId, occurrence._id, {
          outcome: "cancelled",
        });
      }
    }

    // 4. Task Uncancelled (was cancelled, now todo or in-progress)
    if (
      previousStatus === "cancelled" &&
      (task.status === "todo" || task.status === "in-progress")
    ) {
      const todayOccurrence = await TaskOccurrence.findOne({
        userId,
        taskId: task._id,
        $or: [{ date: today }, { productDate: todayProductDate }],
        outcome: "cancelled",
      });

      if (todayOccurrence) {
        return await this.recordOutcome(userId, todayOccurrence._id, {
          outcome: "pending",
        });
      }
    }

    return null;
  }

  /**
   * Deterministically transitions past pending occurrences to "missed".
   *
   * @param {string | mongoose.Types.ObjectId} userId
   * @param {Date | string} [asOfDate=new Date()]
   * @param {string} [timezone]
   * @returns {Promise<object>}
   */
  async evaluateMissedOccurrences(
    userId,
    asOfDate = new Date(),
    timezone = null
  ) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(asOfDate, tz);
    const todayStart = toStartOfDayUTC(todayProductDate, "UTC");

    return await TaskOccurrence.updateMany(
      {
        userId,
        outcome: "pending",
        $or: [
          { productDate: { $lt: todayProductDate } },
          { productDate: { $exists: false }, date: { $lt: todayStart } },
        ],
      },
      {
        $set: { outcome: "missed" },
      }
    );
  }

  /**
   * Query historical and planned task occurrences.
   *
   * @param {string | mongoose.Types.ObjectId} userId
   * @param {object} query
   * @param {string} [timezone]
   * @returns {Promise<Array<TaskOccurrence>>}
   */
  async getOccurrences(userId, query = {}, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    await this.evaluateMissedOccurrences(userId, new Date(), tz);

    const filter = { userId };

    if (query.date) {
      const pDate = getProductDate(query.date, tz);
      filter.$or = [
        { productDate: pDate },
        { date: toStartOfDayUTC(pDate, "UTC") },
      ];
    } else if (query.startDate || query.endDate) {
      const { start, end, startProductDate, endProductDate } = parseDateRange(
        query.startDate,
        query.endDate,
        tz
      );
      const prodRange = {};
      if (startProductDate) prodRange.$gte = startProductDate;
      if (endProductDate) prodRange.$lte = endProductDate;

      const dateRange = {};
      if (start) dateRange.$gte = start;
      if (end) dateRange.$lte = end;

      filter.$or = [
        { productDate: prodRange },
        { productDate: { $exists: false }, date: dateRange },
      ];
    }

    if (query.taskId) {
      if (!mongoose.Types.ObjectId.isValid(query.taskId)) {
        throw this._createError("Invalid taskId format", 400);
      }
      filter.taskId = query.taskId;
    }

    if (query.outcome) {
      filter.outcome = query.outcome;
    }

    const occurrences = await TaskOccurrence.find(filter)
      .sort({ date: 1, createdAt: 1 })
      .populate("taskId", "title status priority goal dueDate plannedDate");

    return occurrences.map((occ) => {
      const obj = occ.toObject ? occ.toObject() : occ;
      if (!obj.taskId && obj.taskSnapshot) {
        obj.taskTitle = obj.taskSnapshot.title || "Deleted Task";
        obj.taskPriority = obj.taskSnapshot.priority || "medium";
        obj.isTaskDeleted = true;
      }
      return obj;
    });
  }
}

export default new TaskOccurrenceService();
