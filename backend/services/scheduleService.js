import mongoose from "mongoose";
import ScheduleBlock from "../models/scheduleBlockModel.js";
import Task from "../models/taskModel.js";

class ScheduleService {
  /**
   * Helper to create typed operational errors
   */
  _createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  /**
   * Normalize a date to UTC start of day
   */
  _getStartOfDayUTC(date) {
    const d = new Date(date);
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
    );
  }

  /**
   * Normalize a date to UTC end of day
   */
  _getEndOfDayUTC(date) {
    const d = new Date(date);
    return new Date(
      Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );
  }

  /**
   * Create a new ScheduleBlock
   */
  async createScheduleBlock(userId, data) {
    const { taskId, date, startTime, endTime, status } = data;

    if (!taskId) {
      throw this._createError("taskId is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw this._createError("Invalid taskId format", 400);
    }

    // Verify task existence and user ownership
    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task) {
      throw this._createError("Task not found or access denied", 404);
    }

    if (!startTime || !endTime) {
      throw this._createError("startTime and endTime are required", 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw this._createError("Invalid startTime or endTime format", 400);
    }

    if (start.getTime() >= end.getTime()) {
      throw this._createError("startTime must occur before endTime", 400);
    }

    const durationMinutes = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60)
    );

    if (durationMinutes <= 0) {
      throw this._createError("durationMinutes must be positive", 400);
    }

    const blockDate = date ? new Date(date) : this._getStartOfDayUTC(start);
    if (isNaN(blockDate.getTime())) {
      throw this._createError("Invalid date format", 400);
    }

    const validStatuses = ["scheduled", "completed", "skipped"];
    if (status && !validStatuses.includes(status)) {
      throw this._createError(
        `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
        400
      );
    }

    const scheduleBlock = await ScheduleBlock.create({
      userId,
      taskId,
      date: blockDate,
      startTime: start,
      endTime: end,
      durationMinutes,
      status: status || "scheduled",
    });

    return ScheduleBlock.findById(scheduleBlock._id)
      .populate("taskId", "title status priority goal dueDate plannedDate")
      .populate("sessionId", "sessionId status completionType duration totalFocusMinutes startedAt endedAt");
  }

  /**
   * Query ScheduleBlocks for a user with date/status filters
   */
  async getScheduleBlocks(userId, query = {}) {
    const filter = { userId };

    if (query.date) {
      const targetDate = new Date(query.date);
      if (isNaN(targetDate.getTime())) {
        throw this._createError("Invalid date parameter", 400);
      }
      const startOfDay = this._getStartOfDayUTC(targetDate);
      const endOfDay = this._getEndOfDayUTC(targetDate);

      filter.$or = [
        { date: { $gte: startOfDay, $lte: endOfDay } },
        { startTime: { $gte: startOfDay, $lte: endOfDay } },
      ];
    } else if (query.startDate && query.endDate) {
      const startRange = new Date(query.startDate);
      const endRange = new Date(query.endDate);
      if (isNaN(startRange.getTime()) || isNaN(endRange.getTime())) {
        throw this._createError("Invalid startDate or endDate parameter", 400);
      }
      filter.startTime = { $gte: startRange, $lte: endRange };
    }

    if (query.taskId) {
      if (!mongoose.Types.ObjectId.isValid(query.taskId)) {
        throw this._createError("Invalid taskId format", 400);
      }
      filter.taskId = query.taskId;
    }

    if (query.status) {
      const validStatuses = ["scheduled", "completed", "skipped"];
      if (!validStatuses.includes(query.status)) {
        throw this._createError(
          `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
          400
        );
      }
      filter.status = query.status;
    }

    return ScheduleBlock.find(filter)
      .sort({ startTime: 1 })
      .populate("taskId", "title status priority goal dueDate plannedDate")
      .populate("sessionId", "sessionId status completionType duration totalFocusMinutes startedAt endedAt");
  }

  /**
   * Get single ScheduleBlock by ID
   */
  async getScheduleBlockById(userId, blockId) {
    if (!mongoose.Types.ObjectId.isValid(blockId)) {
      throw this._createError("Invalid schedule block ID format", 400);
    }

    const block = await ScheduleBlock.findOne({
      _id: blockId,
      userId,
    })
      .populate("taskId", "title status priority goal dueDate plannedDate")
      .populate("sessionId", "sessionId status completionType duration totalFocusMinutes startedAt endedAt");

    if (!block) {
      throw this._createError("Schedule block not found", 404);
    }

    return block;
  }

  /**
   * Update ScheduleBlock
   */
  async updateScheduleBlock(userId, blockId, data) {
    if (!mongoose.Types.ObjectId.isValid(blockId)) {
      throw this._createError("Invalid schedule block ID format", 400);
    }

    // Prohibit changing userId
    if (data.userId && data.userId.toString() !== userId.toString()) {
      throw this._createError("Modifying block owner is not permitted", 400);
    }

    const existingBlock = await ScheduleBlock.findOne({
      _id: blockId,
      userId,
    });

    if (!existingBlock) {
      throw this._createError("Schedule block not found", 404);
    }

    // Prohibit changing taskId
    if (
      data.taskId &&
      data.taskId.toString() !== existingBlock.taskId.toString()
    ) {
      throw this._createError("Changing taskId is not permitted", 400);
    }

    // Prohibit changing sessionId manually
    if (
      data.sessionId !== undefined &&
      data.sessionId?.toString() !== existingBlock.sessionId?.toString()
    ) {
      throw this._createError("Directly modifying sessionId is not permitted", 400);
    }

    const updates = {};

    if (data.status !== undefined) {
      const validStatuses = ["scheduled", "completed", "skipped"];
      if (!validStatuses.includes(data.status)) {
        throw this._createError(
          `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
          400
        );
      }
      updates.status = data.status;
    }

    let nextStart = existingBlock.startTime;
    let nextEnd = existingBlock.endTime;
    let timesChanged = false;

    if (data.startTime !== undefined) {
      const parsedStart = new Date(data.startTime);
      if (isNaN(parsedStart.getTime())) {
        throw this._createError("Invalid startTime format", 400);
      }
      nextStart = parsedStart;
      timesChanged = true;
    }

    if (data.endTime !== undefined) {
      const parsedEnd = new Date(data.endTime);
      if (isNaN(parsedEnd.getTime())) {
        throw this._createError("Invalid endTime format", 400);
      }
      nextEnd = parsedEnd;
      timesChanged = true;
    }

    if (timesChanged) {
      if (nextStart.getTime() >= nextEnd.getTime()) {
        throw this._createError("startTime must occur before endTime", 400);
      }
      const durationMinutes = Math.round(
        (nextEnd.getTime() - nextStart.getTime()) / (1000 * 60)
      );
      if (durationMinutes <= 0) {
        throw this._createError("durationMinutes must be positive", 400);
      }
      updates.startTime = nextStart;
      updates.endTime = nextEnd;
      updates.durationMinutes = durationMinutes;
    }

    if (data.date !== undefined) {
      const parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        throw this._createError("Invalid date format", 400);
      }
      updates.date = parsedDate;
    } else if (timesChanged && !existingBlock.date) {
      updates.date = this._getStartOfDayUTC(nextStart);
    }

    const updated = await ScheduleBlock.findOneAndUpdate(
      { _id: blockId, userId },
      { $set: updates },
      { new: true }
    )
      .populate("taskId", "title status priority goal dueDate plannedDate")
      .populate("sessionId", "sessionId status completionType duration totalFocusMinutes startedAt endedAt");

    return updated;
  }

  /**
   * Delete ScheduleBlock
   */
  async deleteScheduleBlock(userId, blockId) {
    if (!mongoose.Types.ObjectId.isValid(blockId)) {
      throw this._createError("Invalid schedule block ID format", 400);
    }

    const block = await ScheduleBlock.findOneAndDelete({
      _id: blockId,
      userId,
    });

    if (!block) {
      throw this._createError("Schedule block not found", 404);
    }

    const Session = (await import("../models/sessionModel.js")).default;
    await Session.updateMany(
      { scheduleBlockId: blockId, userId },
      { $set: { scheduleBlockId: null } }
    );

    return block;
  }
}

export default new ScheduleService();
