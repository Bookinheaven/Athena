import taskRepository from "../../repositories/taskRepository.js";
import routineOccurrenceRepository from "../../repositories/routineOccurrenceRepository.js";
import scheduleBlockRepository from "../../repositories/scheduleBlockRepository.js";
import dailyStatsRepository from "../../repositories/dailyStatsRepository.js";
import streakRepository from "../../repositories/streakRepository.js";
import {
  getProductDate,
  resolveUserTimezone,
  productDateToStart,
  productDateToEnd,
} from "../../utils/dateUtils.js";
import {
  calculateRollingCapacity,
  getPrecedingDateWindow,
  CAPACITY_WINDOW_DAYS,
} from "../../utils/capacityEngine.js";
import { AI_CONFIG } from "./aiConfig.js";

export const DEFAULT_PLANNING_WINDOW = AI_CONFIG.planning.defaultPlanningWindow;
export const DEFAULT_TASK_DURATION_MINUTES = AI_CONFIG.planning.defaultTaskDurationMinutes;
export const MAX_OVERDUE_TASKS_BOUND = AI_CONFIG.planning.maxOverdueTasksBound;
export const MAX_TOTAL_CANDIDATES = AI_CONFIG.planning.maxTotalCandidates;

class PlanningContextService {
  /**
   * Helper to parse a time string ("HH:mm" or ISO string) relative to a productDate and timezone into a Date object.
   */
  _parseWindowTime(timeInput, productDate, timezone, isEnd = false) {
    if (!timeInput) return isEnd ? productDateToEnd(productDate, timezone) : productDateToStart(productDate, timezone);

    // If ISO timestamp string
    if (typeof timeInput === "string" && (timeInput.includes("T") || (timeInput.includes("-") && timeInput.length > 5))) {
      const parsed = new Date(timeInput);
      if (!isNaN(parsed.getTime())) return parsed;
      const err = new Error(`Invalid ISO timestamp provided for planning window: '${timeInput}'`);
      err.statusCode = 400;
      throw err;
    }

    // If "HH:mm" format
    if (typeof timeInput === "string") {
      const trimmed = timeInput.trim();
      if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
        const [hours, minutes] = trimmed.split(":").map(Number);
        if (hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60) {
          const dayStart = productDateToStart(productDate, timezone);
          const msOffset = (hours * 60 + minutes) * 60 * 1000;
          return new Date(dayStart.getTime() + msOffset);
        }
      }
      const err = new Error(`Invalid time format provided for planning window: '${timeInput}'. Expected 'HH:mm' or ISO timestamp.`);
      err.statusCode = 400;
      throw err;
    }

    return isEnd ? productDateToEnd(productDate, timezone) : productDateToStart(productDate, timezone);
  }

  /**
   * Assembles comprehensive planning context for the authenticated user and productDate.
   *
   * @param {string} userId Authenticated user ID (req.user.id)
   * @param {object} [options]
   * @param {string} [options.productDate] Target product date "YYYY-MM-DD"
   * @param {object} [options.planningWindow] { startTime: "09:00", endTime: "17:00" }
   * @param {number} [options.defaultTaskDurationMinutes=30]
   * @param {number} [options.maxOverdueTasks=10]
   * @returns {Promise<object>} Planning context
   */
  async assembleContext(userId, options = {}) {
    if (!userId) {
      const err = new Error("Valid authenticated userId is required");
      err.statusCode = 401;
      throw err;
    }

    // 1. Resolve Timezone and Canonical Product Date
    const timezone = await resolveUserTimezone(userId, options.timezone);
    const productDate = getProductDate(options.productDate || new Date(), timezone);

    const defaultDuration = Math.max(
      5,
      Math.min(240, Number(options.defaultTaskDurationMinutes || DEFAULT_TASK_DURATION_MINUTES))
    );

    // 2. Planning Window Resolution
    const rawWindow = options.planningWindow || DEFAULT_PLANNING_WINDOW;
    const windowStart = this._parseWindowTime(rawWindow.startTime, productDate, timezone, false);
    const windowEnd = this._parseWindowTime(rawWindow.endTime, productDate, timezone, true);

    if (windowEnd.getTime() <= windowStart.getTime()) {
      const err = new Error("Planning window endTime must be strictly after startTime");
      err.statusCode = 400;
      throw err;
    }

    const totalWindowMinutes = Math.round((windowEnd.getTime() - windowStart.getTime()) / 60000);

    // 3. Existing ScheduleBlocks (Occupied Time Intervals)
    const existingBlocks = await scheduleBlockRepository.findByUserAndDate(userId, productDate);
    const activeBlocks = existingBlocks.filter((b) => b.status !== "skipped");

    const scheduledTaskIds = new Set();
    const scheduledRoutineOccIds = new Set();
    const occupiedIntervals = [];

    for (const b of activeBlocks) {
      if (b.taskId) {
        const tId = typeof b.taskId === "object" ? b.taskId.id : b.taskId;
        if (tId) scheduledTaskIds.add(String(tId));
      }
      if (b.routineOccurrenceId) {
        const rId = typeof b.routineOccurrenceId === "object" ? b.routineOccurrenceId.id : b.routineOccurrenceId;
        if (rId) scheduledRoutineOccIds.add(String(rId));
      }

      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);

      occupiedIntervals.push({
        id: b.id,
        startTime: bStart.toISOString(),
        endTime: bEnd.toISOString(),
        startMs: bStart.getTime(),
        endMs: bEnd.getTime(),
        durationMinutes: b.durationMinutes || Math.round((bEnd - bStart) / 60000),
        title: b.snapshotTaskTitle || "Occupied Schedule Block",
        targetType: b.routineOccurrenceId ? "routine_occurrence" : b.taskId ? "task" : "custom",
        targetId: b.routineOccurrenceId || b.taskId || b.id,
      });
    }

    // Sort occupied intervals ascending by start time
    occupiedIntervals.sort((a, b) => a.startMs - b.startMs);

    // 4. Eligible Routine Occurrences (strictly read-only)
    // Exclude completed, skipped, missed, archived, or already scheduled
    const dayRoutines = await routineOccurrenceRepository.findByUserAndDate(userId, productDate);
    const eligibleRoutines = [];

    for (const r of dayRoutines) {
      if (r.routineStatus === "archived" || r.status === "archived") continue;
      if (r.status === "completed" || r.status === "skipped" || r.status === "missed") continue;
      if (scheduledRoutineOccIds.has(String(r.id))) continue; // Already scheduled

      const estimatedMinutes = r.estimatedMinutes && Number(r.estimatedMinutes) > 0
        ? Number(r.estimatedMinutes)
        : defaultDuration;
      const isDurationAssumed = !Boolean(r.estimatedMinutes);

      eligibleRoutines.push({
        id: r.id,
        targetType: "routine_occurrence",
        title: r.snapshotTitle || "Routine",
        priority: "high", // Routines are daily habit commitments
        durationMinutes: estimatedMinutes,
        isDurationAssumed,
        stepProgress: `${r.completedSteps || 0}/${r.totalSteps || 1}`,
        targetTime: r.targetTime || null,
        productDate: r.productDate,
      });
    }

    // 5. Eligible Incomplete Tasks
    // Rule: Tasks with status 'todo' or 'in-progress'
    // - Planned for today: t.plannedProductDate === productDate
    // - Overdue: plannedProductDate < productDate OR dueDate < productDate
    // - Backlog tasks if capacity allows
    const allUserTasks = await taskRepository.findByUserId(userId);
    const incompleteTasks = allUserTasks.filter(
      (t) => (t.status === "todo" || t.status === "in-progress") && !scheduledTaskIds.has(String(t.id))
    );

    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const maxOverdue = Math.max(1, Number(options.maxOverdueTasks || MAX_OVERDUE_TASKS_BOUND));

    const todayTasks = [];
    const overdueTasks = [];
    const otherTasks = [];

    for (const t of incompleteTasks) {
      const isPlannedToday = t.plannedProductDate === productDate;
      const isOverdue =
        (t.plannedProductDate && t.plannedProductDate < productDate) ||
        (t.dueDate && t.dueDate < productDate);

      if (isPlannedToday) {
        todayTasks.push(t);
      } else if (isOverdue) {
        overdueTasks.push(t);
      } else {
        otherTasks.push(t);
      }
    }

    // Bounded overdue tasks selection rule:
    // Sort by priority (high > medium > low), then oldest plannedProductDate/dueDate first
    overdueTasks.sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
      if (pDiff !== 0) return pDiff;
      const dateA = a.plannedProductDate || a.dueDate || "9999-99-99";
      const dateB = b.plannedProductDate || b.dueDate || "9999-99-99";
      return dateA.localeCompare(dateB);
    });

    const boundedOverdue = overdueTasks.slice(0, maxOverdue);

    // Sort today's tasks by priority
    todayTasks.sort((a, b) => (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2));

    // Combine eligible tasks
    const eligibleTasksRaw = [...todayTasks, ...boundedOverdue];
    // Fill with active backlog tasks up to MAX_TOTAL_CANDIDATES
    const remainingSlots = Math.max(0, MAX_TOTAL_CANDIDATES - (eligibleRoutines.length + eligibleTasksRaw.length));
    if (remainingSlots > 0 && otherTasks.length > 0) {
      otherTasks.sort((a, b) => (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2));
      eligibleTasksRaw.push(...otherTasks.slice(0, remainingSlots));
    }

    const eligibleTasks = eligibleTasksRaw.map((t) => {
      const isOverdue =
        (t.plannedProductDate && t.plannedProductDate < productDate) ||
        (t.dueDate && t.dueDate < productDate);

      return {
        id: t.id,
        targetType: "task",
        title: t.title,
        priority: t.priority || "medium",
        dueDate: t.dueDate || null,
        plannedProductDate: t.plannedProductDate || null,
        isOverdue: Boolean(isOverdue),
        durationMinutes: defaultDuration,
        isDurationAssumed: true, // Tasks in Athena schema do not store explicit duration
      };
    });

    // 6. Rolling Capacity & Daily Target
    const streak = await streakRepository.findByUserId(userId);
    const dailyTargetMinutes = streak?.dailyTargetMinutes ?? 25;

    const { windowStart: cStart, windowEnd: cEnd } = getPrecedingDateWindow(productDate, CAPACITY_WINDOW_DAYS);
    const pastStats = await dailyStatsRepository.findByUserAndDateRange(userId, cStart, cEnd);
    const capacityResult = calculateRollingCapacity(pastStats, productDate);

    // Compute total already scheduled minutes
    const currentlyScheduledMinutes = occupiedIntervals.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

    // All candidates for scheduling
    const candidates = [...eligibleRoutines, ...eligibleTasks];

    return {
      userId,
      productDate,
      timezone,
      planningWindow: {
        startTime: windowStart.toISOString(),
        endTime: windowEnd.toISOString(),
        startMs: windowStart.getTime(),
        endMs: windowEnd.getTime(),
        formattedRange: `${windowStart.toLocaleTimeString("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false })} – ${windowEnd.toLocaleTimeString("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false })}`,
        totalWindowMinutes,
      },
      defaultTaskDurationMinutes: defaultDuration,
      occupiedIntervals,
      candidates,
      eligibleRoutines,
      eligibleTasks,
      currentlyScheduledMinutes,
      dailyFocusTargetMinutes: dailyTargetMinutes,
      capacityResult,
    };
  }
}

export const planningContextService = new PlanningContextService();
export default planningContextService;
