import scheduleBlockRepository from "../repositories/scheduleBlockRepository.js";
import taskRepository from "../repositories/taskRepository.js";
import routineOccurrenceRepository from "../repositories/routineOccurrenceRepository.js";
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

  async _populateBlocks(userId, blocks) {
    if (!Array.isArray(blocks) || blocks.length === 0) return blocks;
    const taskIds = blocks
      .map((b) => (typeof b.taskId === "object" ? b.taskId?.id : b.taskId))
      .filter(Boolean);
    const routineOccIds = blocks
      .map((b) =>
        typeof b.routineOccurrenceId === "object"
          ? b.routineOccurrenceId?.id
          : b.routineOccurrenceId
      )
      .filter(Boolean);

    const [taskList, routineOccList] = await Promise.all([
      taskIds.length > 0 ? taskRepository.findByIds(userId, taskIds) : Promise.resolve([]),
      routineOccIds.length > 0 ? routineOccurrenceRepository.findByIds(routineOccIds) : Promise.resolve([]),
    ]);

    const taskMap = new Map(taskList.map((t) => [String(t.id), t]));
    const routineOccMap = new Map(routineOccList.map((r) => [String(r.id), r]));

    for (const b of blocks) {
      if (b.taskId && typeof b.taskId !== "object") {
        b.taskId = taskMap.get(String(b.taskId)) || b.taskId;
      }
      if (b.routineOccurrenceId) {
        const occIdStr = typeof b.routineOccurrenceId === "object" ? String(b.routineOccurrenceId.id) : String(b.routineOccurrenceId);
        b.routineOccurrence = routineOccMap.get(occIdStr) || null;
      }
    }
    return blocks;
  }

  async createScheduleBlock(userId, data) {
    const { taskId, routineOccurrenceId, date, startTime, endTime, status } = data;

    const hasTaskId = Boolean(taskId || data.task);
    const hasRoutineOccId = Boolean(routineOccurrenceId);

    if ((!hasTaskId && !hasRoutineOccId) || (hasTaskId && hasRoutineOccId)) {
      throw this._createError("ScheduleBlock must target either a taskId or a routineOccurrenceId, not both", 400);
    }

    let resolvedTask = null;
    let resolvedRoutineOcc = null;

    if (hasTaskId) {
      resolvedTask = await taskRepository.findById(userId, taskId || data.task);
      if (!resolvedTask) {
        throw this._createError("Task not found or access denied", 404);
      }
    } else {
      resolvedRoutineOcc = await routineOccurrenceRepository.findById(routineOccurrenceId);
      if (!resolvedRoutineOcc || resolvedRoutineOcc.userId !== userId) {
        throw this._createError("Routine occurrence not found or access denied", 404);
      }
      const existing = await scheduleBlockRepository.findByRoutineOccurrenceId(userId, routineOccurrenceId);
      if (existing) {
        throw this._createError("A schedule block already exists for this routine occurrence", 400);
      }
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
      taskId: hasTaskId ? (taskId || data.task) : null,
      routineOccurrenceId: hasRoutineOccId ? routineOccurrenceId : null,
      date: date || start.toISOString().slice(0, 10),
      startTime: start,
      endTime: end,
      durationMinutes,
      status: status || "scheduled",
    });

    if (resolvedTask) {
      created.taskId = resolvedTask;
    }
    if (resolvedRoutineOcc) {
      created.routineOccurrence = resolvedRoutineOcc;
    }
    return created;
  }

  async getScheduleBlocks(userId, query = {}, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));

    if (query.date) {
      const pDate = getProductDate(query.date, tz);
      const blocks = await scheduleBlockRepository.findByUserAndDate(userId, pDate);
      return this._populateBlocks(userId, blocks);
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
      return this._populateBlocks(userId, blocks);
    }

    return [];
  }

  async getScheduleBlockById(userId, blockId) {
    const block = await scheduleBlockRepository.findById(blockId);
    if (block && block.userId === userId) {
      const [populated] = await this._populateBlocks(userId, [block]);
      return populated;
    }
    throw this._createError("ScheduleBlock not found or access denied", 404);
  }

  async updateScheduleBlock(userId, blockId, data) {
    const existing = await scheduleBlockRepository.findById(blockId);
    if (!existing || existing.userId !== userId) {
      throw this._createError("ScheduleBlock not found or access denied", 404);
    }

    const nextTaskId = data.taskId !== undefined ? data.taskId : (data.task !== undefined ? data.task : existing.taskId);
    const nextRoutineOccId = data.routineOccurrenceId !== undefined ? data.routineOccurrenceId : existing.routineOccurrenceId;

    if (nextTaskId && nextRoutineOccId) {
      throw this._createError("ScheduleBlock cannot target both a task and a routine occurrence", 400);
    }

    if (data.taskId && data.taskId !== existing.taskId) {
      const task = await taskRepository.findById(userId, data.taskId);
      if (!task) throw this._createError("Task not found or access denied", 404);
    }

    if (data.routineOccurrenceId && data.routineOccurrenceId !== existing.routineOccurrenceId) {
      const occ = await routineOccurrenceRepository.findById(data.routineOccurrenceId);
      if (!occ || occ.userId !== userId) throw this._createError("Routine occurrence not found or access denied", 404);
      const duplicate = await scheduleBlockRepository.findByRoutineOccurrenceId(userId, data.routineOccurrenceId);
      if (duplicate && duplicate.id !== blockId) {
        throw this._createError("A schedule block already exists for this routine occurrence", 400);
      }
    }

    const updated = await scheduleBlockRepository.update(userId, blockId, data);
    if (updated) {
      const [populated] = await this._populateBlocks(userId, [updated]);
      return populated;
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
