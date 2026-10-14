import routineRepository, {
  normalizeRoutineId,
} from "../repositories/routineRepository.js";
import routineOccurrenceRepository, {
  normalizeOccurrenceId,
  normalizeStepOccurrenceId,
} from "../repositories/routineOccurrenceRepository.js";
import goalRepository from "../repositories/goalRepository.js";
import {
  getProductDate,
  resolveUserTimezone,
} from "../utils/dateUtils.js";

function getIsoWeekday(productDateStr) {
  const [y, m, d] = productDateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  return dow === 0 ? 7 : dow; // 1 = Monday, 7 = Sunday
}

class RoutineService {
  async listRoutines(userId, options = {}) {
    return routineRepository.findByUserId(userId, options);
  }

  async getRoutineById(userId, routineId) {
    const routine = await routineRepository.findById(userId, routineId);
    if (!routine) {
      const err = new Error("Routine not found or access denied");
      err.statusCode = 404;
      throw err;
    }
    return routine;
  }

  async createRoutine(userId, data, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(new Date(), tz);

    const title = String(data.title || "").trim();
    if (!title) {
      const err = new Error("Routine title is required");
      err.statusCode = 400;
      throw err;
    }
    if (title.length > 150) {
      const err = new Error("Routine title must be 150 characters or less");
      err.statusCode = 400;
      throw err;
    }

    const steps = Array.isArray(data.steps) ? data.steps : [];
    if (steps.length === 0) {
      const err = new Error("Every routine must have at least one step");
      err.statusCode = 400;
      throw err;
    }

    // Goal ownership validation
    if (data.goalId) {
      const goal = await goalRepository.findById(userId, data.goalId);
      if (!goal) {
        const err = new Error("Goal not found or does not belong to user");
        err.statusCode = 400;
        throw err;
      }
    }

    // Default startProductDate to today's product date if not specified or past
    let startProductDate = todayProductDate;
    if (data.startProductDate && typeof data.startProductDate === "string") {
      const candidate = data.startProductDate.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
        startProductDate = candidate;
      }
    }

    // Compute estimated duration if steps provide them
    let estimatedMinutes = Math.max(1, Number(data.estimatedMinutes) || 15);
    const stepsWithEstimates = steps.filter((s) => s.estimatedMinutes && Number(s.estimatedMinutes) > 0);
    if (stepsWithEstimates.length > 0 && (!data.estimatedMinutes || data.estimatedMinutes === 15)) {
      estimatedMinutes = stepsWithEstimates.reduce((sum, s) => sum + Number(s.estimatedMinutes), 0);
    }

    // Format ordered steps
    const orderedSteps = steps.map((s, idx) => ({
      title: String(s.title || `Step ${idx + 1}`).trim().slice(0, 150),
      sortOrder: Number(s.sortOrder ?? idx),
      estimatedMinutes: s.estimatedMinutes ? Math.max(1, Number(s.estimatedMinutes)) : null,
    }));

    const routinePayload = {
      title,
      description: data.description || "",
      status: "active",
      recurrenceType: data.recurrenceType === "selected_days" ? "selected_days" : "daily",
      recurrenceDays: Array.isArray(data.recurrenceDays) && data.recurrenceDays.length > 0
        ? data.recurrenceDays.map(Number)
        : [1, 2, 3, 4, 5, 6, 7],
      startProductDate,
      estimatedMinutes,
      targetTime: data.targetTime ? String(data.targetTime).slice(0, 5) : null,
      goalId: data.goalId || null,
    };

    const routine = await routineRepository.create(userId, routinePayload, orderedSteps);

    // If starting today and recurrence applies today, immediately generate today's occurrence
    const todayIsoDay = getIsoWeekday(todayProductDate);
    const appliesToday =
      startProductDate <= todayProductDate &&
      (routine.recurrenceType === "daily" || routine.recurrenceDays.includes(todayIsoDay));

    if (appliesToday) {
      await routineOccurrenceRepository.createOccurrenceWithSteps(
        userId,
        {
          routineId: routine.id,
          productDate: todayProductDate,
          snapshotTitle: routine.title,
          snapshotGoalId: routine.goalId,
        },
        routine.steps
      );
    }

    return routine;
  }

  async updateRoutine(userId, routineId, data, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(new Date(), tz);

    const existing = await routineRepository.findById(userId, routineId);
    if (!existing) {
      const err = new Error("Routine not found or access denied");
      err.statusCode = 404;
      throw err;
    }

    if (data.title !== undefined) {
      const title = String(data.title).trim();
      if (!title) {
        const err = new Error("Routine title cannot be empty");
        err.statusCode = 400;
        throw err;
      }
      if (title.length > 150) {
        const err = new Error("Routine title must be 150 characters or less");
        err.statusCode = 400;
        throw err;
      }
    }

    if (Array.isArray(data.steps) && data.steps.length === 0) {
      const err = new Error("Routine must have at least one step");
      err.statusCode = 400;
      throw err;
    }

    if (data.goalId !== undefined && data.goalId !== null) {
      const goal = await goalRepository.findById(userId, data.goalId);
      if (!goal) {
        const err = new Error("Goal not found or does not belong to user");
        err.statusCode = 400;
        throw err;
      }
    }

    let orderedSteps = null;
    if (Array.isArray(data.steps)) {
      orderedSteps = data.steps.map((s, idx) => ({
        title: String(s.title || `Step ${idx + 1}`).trim().slice(0, 150),
        sortOrder: Number(s.sortOrder ?? idx),
        estimatedMinutes: s.estimatedMinutes ? Math.max(1, Number(s.estimatedMinutes)) : null,
      }));
    }

    const updated = await routineRepository.update(userId, routineId, data, orderedSteps);

    // If recurrence days changed, delete future unstarted occurrences on days no longer included
    if (data.recurrenceDays && Array.isArray(data.recurrenceDays)) {
      const oldDays = existing.recurrenceDays || [1, 2, 3, 4, 5, 6, 7];
      const newDays = updated.recurrenceDays;
      const removedDays = oldDays.filter((d) => !newDays.includes(d));
      if (removedDays.length > 0) {
        await routineOccurrenceRepository.deleteFuturePendingOnWeekdays(
          userId,
          routineId,
          todayProductDate,
          removedDays
        );
      }
    }

    // Refresh future unstarted pending occurrences to match new title, goal, and steps
    await routineOccurrenceRepository.refreshFuturePendingSnapshots(
      userId,
      routineId,
      todayProductDate,
      updated.title,
      updated.goalId,
      updated.steps
    );

    return updated;
  }

  async updateStatus(userId, routineId, status, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(new Date(), tz);

    if (!["active", "paused", "archived"].includes(status)) {
      const err = new Error("Invalid status. Allowed: active, paused, archived");
      err.statusCode = 400;
      throw err;
    }

    const updated = await routineRepository.updateStatus(userId, routineId, status);
    if (!updated) {
      const err = new Error("Routine not found or access denied");
      err.statusCode = 404;
      throw err;
    }

    // When paused or archived, delete future unstarted occurrences
    if (status === "paused" || status === "archived") {
      await routineOccurrenceRepository.deleteFuturePendingByRoutineId(
        userId,
        routineId,
        todayProductDate
      );
    } else if (status === "active") {
      // Re-activated -> check if eligible today
      const todayIsoDay = getIsoWeekday(todayProductDate);
      const appliesToday =
        updated.startProductDate <= todayProductDate &&
        (updated.recurrenceType === "daily" || updated.recurrenceDays.includes(todayIsoDay));

      if (appliesToday) {
        await routineOccurrenceRepository.createOccurrenceWithSteps(
          userId,
          {
            routineId: updated.id,
            productDate: todayProductDate,
            snapshotTitle: updated.title,
            snapshotGoalId: updated.goalId,
          },
          updated.steps
        );
      }
    }

    return updated;
  }

  async getTodayOccurrences(userId, asOfDate = new Date(), timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(asOfDate, tz);
    const occurrences = await this.ensureOccurrencesForDate(userId, todayProductDate, tz);
    // Archived routines should NOT be displayed on Today's dashboard
    return occurrences.filter((o) => o.routineStatus !== "archived" && o.status !== "archived");
  }

  async ensureOccurrencesForDate(userId, targetProductDate, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const pDate = getProductDate(targetProductDate, tz);
    const currentProductDate = getProductDate(new Date(), tz);

    // HISTORICAL INTEGRITY GUARD:
    // Past dates are strictly read-only! Never generate missing historical occurrences.
    if (pDate < currentProductDate) {
      return routineOccurrenceRepository.findByUserAndDate(userId, pDate);
    }

    const isoDay = getIsoWeekday(pDate);
    const activeRoutines = await routineRepository.findActiveRoutinesForUser(userId);

    for (const r of activeRoutines) {
      // Must not generate prior to routine's startProductDate
      if (r.startProductDate > pDate) {
        continue;
      }

      // Check recurrence rule
      const appliesOnDay =
        r.recurrenceType === "daily" ||
        (Array.isArray(r.recurrenceDays) && r.recurrenceDays.includes(isoDay));

      if (!appliesOnDay) {
        continue;
      }

      // Idempotently ensure occurrence and step instances
      await routineOccurrenceRepository.createOccurrenceWithSteps(
        userId,
        {
          routineId: r.id,
          productDate: pDate,
          snapshotTitle: r.title,
          snapshotGoalId: r.goalId,
        },
        r.steps
      );
    }

    return routineOccurrenceRepository.findByUserAndDate(userId, pDate);
  }

  async completeStep(userId, occurrenceId, stepOccurrenceId, isCompleted = true) {
    const cleanOccId = normalizeOccurrenceId(occurrenceId);
    const cleanStepId = normalizeStepOccurrenceId(stepOccurrenceId);
    if (!cleanOccId || !cleanStepId) {
      const err = new Error("Invalid occurrenceId or stepOccurrenceId");
      err.statusCode = 400;
      throw err;
    }

    const updated = await routineOccurrenceRepository.updateStepCompletion(
      userId,
      cleanOccId,
      cleanStepId,
      isCompleted
    );

    if (!updated) {
      const err = new Error("Routine occurrence or step not found or access denied");
      err.statusCode = 404;
      throw err;
    }

    return updated;
  }

  async skipOccurrence(userId, occurrenceId) {
    const cleanOccId = normalizeOccurrenceId(occurrenceId);
    if (!cleanOccId) {
      const err = new Error("Invalid occurrenceId");
      err.statusCode = 400;
      throw err;
    }

    const updated = await routineOccurrenceRepository.skipOccurrence(userId, cleanOccId);
    if (!updated) {
      const err = new Error("Routine occurrence not found or access denied");
      err.statusCode = 404;
      throw err;
    }

    return updated;
  }

  async deleteRoutine(userId, routineId, timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(new Date(), tz);

    const existing = await routineRepository.findById(userId, routineId);
    if (!existing) {
      const err = new Error("Routine not found or access denied");
      err.statusCode = 404;
      throw err;
    }

    // Delete future unstarted occurrences
    await routineOccurrenceRepository.deleteFuturePendingByRoutineId(
      userId,
      routineId,
      todayProductDate
    );

    // Delete routine definition (routine_occurrences.routineId is set null by DB FK)
    return routineRepository.delete(userId, routineId);
  }

  async evaluateMissedOccurrences(userId, asOfDate = new Date(), timezone = null) {
    const tz = timezone || (await resolveUserTimezone(userId));
    const todayProductDate = getProductDate(asOfDate, tz);
    return routineOccurrenceRepository.evaluateMissedOccurrences(userId, todayProductDate);
  }
}

export const routineService = new RoutineService();
export default routineService;
