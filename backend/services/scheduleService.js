import scheduleBlockRepository from "../repositories/scheduleBlockRepository.js";
import taskRepository from "../repositories/taskRepository.js";
import dailyStatsRepository from "../repositories/dailyStatsRepository.js";
import { parseDateRange, resolveUserTimezone, getProductDate } from "../utils/dateUtils.js";
import {
  calculateRollingCapacity,
  calculatePlanningOverload,
  getPrecedingDateWindow,
  CAPACITY_WINDOW_DAYS,
} from "../utils/capacityEngine.js";

class ScheduleService {
  _createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  async createScheduleBlock(userId, data) {
    const { taskId, date, startTime, endTime, status } = data;

    if (!taskId) {
      throw this._createError("taskId is required", 400);
    }

    // Verify task existence and user ownership
    const task = await taskRepository.findById(userId, taskId);
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

    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    if (durationMinutes <= 0) {
      throw this._createError("durationMinutes must be positive", 400);
    }

    const validStatuses = ["scheduled", "completed", "skipped"];
    if (status && !validStatuses.includes(status)) {
      throw this._createError(`Invalid status. Allowed values: ${validStatuses.join(", ")}`, 400);
    }

    const created = await scheduleBlockRepository.create(userId, {
      taskId,
      date: date || start.toISOString().slice(0, 10),
      startTime: start,
      endTime: end,
      durationMinutes,
      status: status || "scheduled",
    });
    created.taskId = task;
    return created;
  }

  async getScheduleBlocks(userId, query = {}, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));

    if (query.date) {
      const pDate = getProductDate(query.date, tz);
      const blocks = await scheduleBlockRepository.findByUserAndDate(userId, pDate);
      const taskIds = blocks.map((b) => b.taskId).filter(Boolean);
      const taskList = await taskRepository.findByIds(userId, taskIds);
      const taskMap = new Map(taskList.map((t) => [String(t.id), t]));
      for (const b of blocks) {
        b.taskId = taskMap.get(String(b.taskId)) || b.taskId;
      }
      return blocks;
    } else if (query.startDate || query.endDate) {
      const { startProductDate, endProductDate } = parseDateRange(
        query.startDate,
        query.endDate,
        tz
      );
      const blocks = await scheduleBlockRepository.findByUserAndDateRange(
        userId,
        startProductDate,
        endProductDate
      );
      const taskIds = blocks.map((b) => b.taskId).filter(Boolean);
      const taskList = await taskRepository.findByIds(userId, taskIds);
      const taskMap = new Map(taskList.map((t) => [String(t.id), t]));
      for (const b of blocks) {
        b.taskId = taskMap.get(String(b.taskId)) || b.taskId;
      }
      return blocks;
    }

    return [];
  }

  async getScheduleBlockById(userId, blockId) {
    const block = await scheduleBlockRepository.findById(blockId);
    if (block && block.userId === userId) {
      block.taskId = (await taskRepository.findById(userId, block.taskId)) || block.taskId;
      return block;
    }
    throw this._createError("ScheduleBlock not found or access denied", 404);
  }

  async updateScheduleBlock(userId, blockId, data) {
    const updated = await scheduleBlockRepository.update(userId, blockId, data);
    if (updated) {
      updated.taskId = (await taskRepository.findById(userId, updated.taskId)) || updated.taskId;
      return updated;
    }
    throw this._createError("ScheduleBlock not found or access denied", 404);
  }

  async deleteScheduleBlock(userId, blockId) {
    return scheduleBlockRepository.delete(userId, blockId);
  }

  /**
   * Adaptive Intelligence: Planner Capacity Overload Alert
   * Evaluates rolling capacity C14 vs scheduled minutes for target product date.
   *
   * @param {string} userId
   * @param {string} [dateParam=null] Target product date or instant
   * @param {string} [timezone=null]
   * @returns {Promise<object>}
   */
  async getCapacityAlert(userId, dateParam = null, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const targetProductDate = getProductDate(dateParam || new Date(), tz);
    const { windowStart, windowEnd } = getPrecedingDateWindow(
      targetProductDate,
      CAPACITY_WINDOW_DAYS
    );

    // 1. Fetch historical daily stats in preceding 14-day window
    const pastStats = await dailyStatsRepository.findByUserAndDateRange(
      userId,
      windowStart,
      windowEnd
    );

    // 2. Fetch schedule blocks for the target product date
    const blocks = await scheduleBlockRepository.findByUserAndDate(
      userId,
      targetProductDate
    );

    // 3. Compute total planned focus minutes (excluding skipped blocks)
    const scheduledMinutes = blocks
      .filter((b) => b.status !== "skipped")
      .reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

    // 4. Compute rolling capacity C14
    const capacityResult = calculateRollingCapacity(pastStats, targetProductDate);

    // 5. Evaluate planning overload ratio O_day > 1.30
    return calculatePlanningOverload(
      scheduledMinutes,
      capacityResult,
      targetProductDate
    );
  }
}

export default new ScheduleService();
