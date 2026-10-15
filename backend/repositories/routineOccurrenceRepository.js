import { eq, and, asc, desc, inArray, sql, gte, lte } from "drizzle-orm";
import { getDrizzleDb, getPgPool } from "../db/index.js";
import { routineOccurrences } from "../db/schema/routineOccurrences.js";
import { routineStepOccurrences } from "../db/schema/routineStepOccurrences.js";
import { routines } from "../db/schema/routines.js";
import { normalizeUserId } from "./userRepository.js";
import { normalizeRoutineId } from "./routineRepository.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeOccurrenceId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

export function normalizeStepOccurrenceId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

export function toDomainStepOccurrence(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    occurrenceId: row.occurrenceId ?? row.occurrence_id,
    stepId: row.stepId ?? row.step_id ?? null,
    title: row.title,
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0),
    status: row.status || "pending",
    completedAt: row.completedAt ?? row.completed_at ?? null,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

export function toDomainOccurrence(row, steps = []) {
  if (!row) return null;
  const rawDate = row.productDate ?? row.product_date;
  const pDate =
    rawDate instanceof Date
      ? rawDate.toISOString().slice(0, 10)
      : rawDate
      ? String(rawDate).slice(0, 10)
      : null;

  return {
    id: row.id,
    _id: row.id,
    userId: row.userId ?? row.user_id,
    user: row.userId ?? row.user_id,
    routineId: row.routineId ?? row.routine_id ?? null,
    routine: row.routineId ?? row.routine_id ?? null,
    productDate: pDate,
    status: row.status || "pending",
    completedAt: row.completedAt ?? row.completed_at ?? null,
    totalSteps: Number(row.totalSteps ?? row.total_steps ?? 1),
    completedSteps: Number(row.completedSteps ?? row.completed_steps ?? 0),
    snapshotTitle: row.snapshotTitle ?? row.snapshot_title,
    snapshotGoalId: row.snapshotGoalId ?? row.snapshot_goal_id ?? null,
    targetTime: row.targetTime ?? row.target_time ?? null,
    estimatedMinutes: row.estimatedMinutes ?? row.estimated_minutes ?? null,
    routineStatus: row.routineStatus ?? row.routine_status ?? null,
    steps: Array.isArray(steps) ? steps.map(toDomainStepOccurrence) : [],
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

class RoutineOccurrenceRepository {
  async findById(param1, param2 = null) {
    let cleanId;
    let expectedUserId = null;

    if (param2 !== null && param2 !== undefined) {
      // Could be (userId, occurrenceId) or (occurrenceId, userId)
      if (typeof param1 === "string" && isNaN(Number(param1))) {
        expectedUserId = param1;
        cleanId = normalizeOccurrenceId(param2);
      } else {
        cleanId = normalizeOccurrenceId(param1);
        expectedUserId = param2;
      }
    } else {
      cleanId = normalizeOccurrenceId(param1);
    }

    if (!cleanId) return null;

    const db = getDrizzleDb();
    const rows = await db
      .select({
        id: routineOccurrences.id,
        userId: routineOccurrences.userId,
        routineId: routineOccurrences.routineId,
        productDate: routineOccurrences.productDate,
        status: routineOccurrences.status,
        completedAt: routineOccurrences.completedAt,
        totalSteps: routineOccurrences.totalSteps,
        completedSteps: routineOccurrences.completedSteps,
        snapshotTitle: routineOccurrences.snapshotTitle,
        snapshotGoalId: routineOccurrences.snapshotGoalId,
        createdAt: routineOccurrences.createdAt,
        updatedAt: routineOccurrences.updatedAt,
        targetTime: routines.targetTime,
        estimatedMinutes: routines.estimatedMinutes,
        routineStatus: routines.status,
      })
      .from(routineOccurrences)
      .leftJoin(routines, eq(routineOccurrences.routineId, routines.id))
      .where(eq(routineOccurrences.id, cleanId))
      .limit(1);

    if (!rows.length) return null;
    if (expectedUserId && rows[0].userId !== expectedUserId) return null;

    const steps = await db
      .select()
      .from(routineStepOccurrences)
      .where(eq(routineStepOccurrences.occurrenceId, cleanId))
      .orderBy(asc(routineStepOccurrences.sortOrder));

    return toDomainOccurrence(rows[0], steps);
  }

  async findByIds(occurrenceIds) {
    if (!Array.isArray(occurrenceIds) || occurrenceIds.length === 0) return [];
    const cleanIds = occurrenceIds.map(normalizeOccurrenceId).filter(Boolean);
    if (cleanIds.length === 0) return [];

    const db = getDrizzleDb();
    const rows = await db
      .select({
        id: routineOccurrences.id,
        userId: routineOccurrences.userId,
        routineId: routineOccurrences.routineId,
        productDate: routineOccurrences.productDate,
        status: routineOccurrences.status,
        completedAt: routineOccurrences.completedAt,
        totalSteps: routineOccurrences.totalSteps,
        completedSteps: routineOccurrences.completedSteps,
        snapshotTitle: routineOccurrences.snapshotTitle,
        snapshotGoalId: routineOccurrences.snapshotGoalId,
        createdAt: routineOccurrences.createdAt,
        updatedAt: routineOccurrences.updatedAt,
        targetTime: routines.targetTime,
        estimatedMinutes: routines.estimatedMinutes,
        routineStatus: routines.status,
      })
      .from(routineOccurrences)
      .leftJoin(routines, eq(routineOccurrences.routineId, routines.id))
      .where(inArray(routineOccurrences.id, cleanIds));

    if (rows.length === 0) return [];

    const steps = await db
      .select()
      .from(routineStepOccurrences)
      .where(inArray(routineStepOccurrences.occurrenceId, cleanIds))
      .orderBy(asc(routineStepOccurrences.sortOrder));

    const stepsByOccId = new Map();
    for (const step of steps) {
      const occId = String(step.occurrenceId);
      if (!stepsByOccId.has(occId)) stepsByOccId.set(occId, []);
      stepsByOccId.get(occId).push(step);
    }

    return rows.map((row) =>
      toDomainOccurrence(row, stepsByOccId.get(String(row.id)) || [])
    );
  }

  async findByUserAndDate(userId, productDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !productDate) return [];

    const pDate = String(productDate).slice(0, 10);
    const db = getDrizzleDb();

    const rows = await db
      .select({
        id: routineOccurrences.id,
        userId: routineOccurrences.userId,
        routineId: routineOccurrences.routineId,
        productDate: routineOccurrences.productDate,
        status: routineOccurrences.status,
        completedAt: routineOccurrences.completedAt,
        totalSteps: routineOccurrences.totalSteps,
        completedSteps: routineOccurrences.completedSteps,
        snapshotTitle: routineOccurrences.snapshotTitle,
        snapshotGoalId: routineOccurrences.snapshotGoalId,
        createdAt: routineOccurrences.createdAt,
        updatedAt: routineOccurrences.updatedAt,
        targetTime: routines.targetTime,
        estimatedMinutes: routines.estimatedMinutes,
        routineStatus: routines.status,
      })
      .from(routineOccurrences)
      .leftJoin(routines, eq(routineOccurrences.routineId, routines.id))
      .where(
        and(
          eq(routineOccurrences.userId, cleanUserId),
          eq(routineOccurrences.productDate, pDate)
        )
      )
      .orderBy(asc(routineOccurrences.createdAt));

    if (!rows.length) return [];

    const occIds = rows.map((r) => r.id);
    const allSteps = await db
      .select()
      .from(routineStepOccurrences)
      .where(inArray(routineStepOccurrences.occurrenceId, occIds))
      .orderBy(asc(routineStepOccurrences.sortOrder));

    const stepsByOcc = new Map();
    for (const step of allSteps) {
      if (!stepsByOcc.has(step.occurrenceId)) {
        stepsByOcc.set(step.occurrenceId, []);
      }
      stepsByOcc.get(step.occurrenceId).push(step);
    }

    return rows.map((r) => toDomainOccurrence(r, stepsByOcc.get(r.id) || []));
  }

  async findByUserAndRoutineOnDate(userId, routineId, productDate) {
    const cleanUserId = normalizeUserId(userId);
    const cleanRoutineId = normalizeRoutineId(routineId);
    if (!cleanUserId || !cleanRoutineId || !productDate) return null;

    const pDate = String(productDate).slice(0, 10);
    const db = getDrizzleDb();

    const rows = await db
      .select()
      .from(routineOccurrences)
      .where(
        and(
          eq(routineOccurrences.userId, cleanUserId),
          eq(routineOccurrences.routineId, cleanRoutineId),
          eq(routineOccurrences.productDate, pDate)
        )
      )
      .limit(1);

    if (!rows.length) return null;

    const steps = await db
      .select()
      .from(routineStepOccurrences)
      .where(eq(routineStepOccurrences.occurrenceId, rows[0].id))
      .orderBy(asc(routineStepOccurrences.sortOrder));

    return toDomainOccurrence(rows[0], steps);
  }

  async findStepOccurrenceById(stepOccurrenceId) {
    const cleanId = normalizeStepOccurrenceId(stepOccurrenceId);
    if (!cleanId) return null;

    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(routineStepOccurrences)
      .where(eq(routineStepOccurrences.id, cleanId))
      .limit(1);

    return toDomainStepOccurrence(rows[0]);
  }

  async createOccurrenceWithSteps(userId, occurrenceData, stepsData = []) {
    const cleanUserId = normalizeUserId(userId);
    const cleanRoutineId = normalizeRoutineId(occurrenceData.routineId);
    if (!cleanUserId || !cleanRoutineId) throw new Error("Valid userId and routineId required");

    const pDate = String(occurrenceData.productDate).slice(0, 10);
    const pool = getPgPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const title = String(occurrenceData.snapshotTitle || "Routine").trim().slice(0, 150);
      const totalSteps = Math.max(1, stepsData.length);
      const goalId = occurrenceData.snapshotGoalId ? normalizeRoutineId(occurrenceData.snapshotGoalId) : null;

      // Idempotent insertion: ON CONFLICT DO NOTHING
      const occRes = await client.query(
        `INSERT INTO routine_occurrences (
          id, user_id, routine_id, product_date, status, total_steps,
          completed_steps, snapshot_title, snapshot_goal_id, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'pending', $4, 0, $5, $6, NOW(), NOW()
        )
        ON CONFLICT (user_id, routine_id, product_date) DO NOTHING
        RETURNING *`,
        [cleanUserId, cleanRoutineId, pDate, totalSteps, title, goalId]
      );

      let occurrenceRow = occRes.rows[0];
      let stepRows = [];

      if (occurrenceRow) {
        // Occurrence was newly inserted -> insert steps
        for (let i = 0; i < stepsData.length; i++) {
          const s = stepsData[i];
          const stepTitle = String(s.title || `Step ${i + 1}`).trim().slice(0, 150);
          const sortOrder = Number(s.sortOrder ?? i);
          const origStepId = s.id ? normalizeRoutineId(s.id) : null;

          const stepRes = await client.query(
            `INSERT INTO routine_step_occurrences (
              id, occurrence_id, step_id, title, sort_order, status, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, 'pending', NOW(), NOW()
            )
            ON CONFLICT (occurrence_id, sort_order) DO NOTHING
            RETURNING *`,
            [occurrenceRow.id, origStepId, stepTitle, sortOrder]
          );
          if (stepRes.rows[0]) {
            stepRows.push(stepRes.rows[0]);
          }
        }
      } else {
        // Already exists -> fetch existing
        const existingRes = await client.query(
          "SELECT * FROM routine_occurrences WHERE user_id = $1 AND routine_id = $2 AND product_date = $3",
          [cleanUserId, cleanRoutineId, pDate]
        );
        occurrenceRow = existingRes.rows[0];

        const existingStepsRes = await client.query(
          "SELECT * FROM routine_step_occurrences WHERE occurrence_id = $1 ORDER BY sort_order ASC",
          [occurrenceRow.id]
        );
        stepRows = existingStepsRes.rows;
      }

      await client.query("COMMIT");
      return toDomainOccurrence(occurrenceRow, stepRows);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async updateStepCompletion(userId, occurrenceId, stepOccurrenceId, isCompleted = true) {
    const cleanUserId = normalizeUserId(userId);
    const cleanOccId = normalizeOccurrenceId(occurrenceId);
    const cleanStepId = normalizeStepOccurrenceId(stepOccurrenceId);
    if (!cleanUserId || !cleanOccId || !cleanStepId) return null;

    const pool = getPgPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Verify user owns occurrence
      const occRes = await client.query(
        "SELECT * FROM routine_occurrences WHERE id = $1 AND user_id = $2 FOR UPDATE",
        [cleanOccId, cleanUserId]
      );
      if (!occRes.rows.length) {
        await client.query("ROLLBACK");
        return null;
      }

      // Update step status
      const newStatus = isCompleted ? "completed" : "pending";
      const completedAt = isCompleted ? new Date() : null;

      const stepUpdateRes = await client.query(
        `UPDATE routine_step_occurrences
         SET status = $1, completed_at = $2, updated_at = NOW()
         WHERE id = $3 AND occurrence_id = $4
         RETURNING *`,
        [newStatus, completedAt, cleanStepId, cleanOccId]
      );

      if (!stepUpdateRes.rows.length) {
        await client.query("ROLLBACK");
        return null;
      }

      // Count step outcomes for this occurrence
      const allStepsRes = await client.query(
        "SELECT * FROM routine_step_occurrences WHERE occurrence_id = $1 ORDER BY sort_order ASC",
        [cleanOccId]
      );
      const allSteps = allStepsRes.rows;
      const totalSteps = allSteps.length;
      const completedSteps = allSteps.filter((s) => s.status === "completed").length;

      // Compute parent occurrence status
      // An occurrence is 'completed' only when ALL steps are completed
      let parentStatus = "pending";
      let parentCompletedAt = null;

      if (completedSteps === totalSteps && totalSteps > 0) {
        parentStatus = "completed";
        parentCompletedAt = new Date();
      } else if (completedSteps > 0) {
        parentStatus = "in_progress";
      }

      const updatedOccRes = await client.query(
        `UPDATE routine_occurrences
         SET status = $1, completed_steps = $2, total_steps = $3, completed_at = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [parentStatus, completedSteps, totalSteps, parentCompletedAt, cleanOccId]
      );

      await client.query("COMMIT");
      return toDomainOccurrence(updatedOccRes.rows[0], allSteps);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async skipOccurrence(userId, occurrenceId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanOccId = normalizeOccurrenceId(occurrenceId);
    if (!cleanUserId || !cleanOccId) return null;

    const db = getDrizzleDb();
    const rows = await db
      .update(routineOccurrences)
      .set({ status: "skipped", updatedAt: new Date() })
      .where(
        and(
          eq(routineOccurrences.id, cleanOccId),
          eq(routineOccurrences.userId, cleanUserId)
        )
      )
      .returning();

    if (!rows.length) return null;
    return this.findById(cleanOccId);
  }

  async unskipOccurrence(userId, occurrenceId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanOccId = normalizeOccurrenceId(occurrenceId);
    if (!cleanUserId || !cleanOccId) return null;

    const pool = getPgPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Verify user owns occurrence and retrieve it
      const occRes = await client.query(
        "SELECT * FROM routine_occurrences WHERE id = $1 AND user_id = $2 FOR UPDATE",
        [cleanOccId, cleanUserId]
      );
      if (!occRes.rows.length) {
        await client.query("ROLLBACK");
        return null;
      }

      // Query steps
      const allStepsRes = await client.query(
        "SELECT * FROM routine_step_occurrences WHERE occurrence_id = $1 ORDER BY sort_order ASC",
        [cleanOccId]
      );
      const allSteps = allStepsRes.rows;
      const totalSteps = allSteps.length;
      const completedSteps = allSteps.filter((s) => s.status === "completed").length;

      // Determine restored status based on step completion
      let parentStatus = "pending";
      let parentCompletedAt = null;

      if (completedSteps === totalSteps && totalSteps > 0) {
        parentStatus = "completed";
        parentCompletedAt = new Date();
      } else if (completedSteps > 0) {
        parentStatus = "in_progress";
      }

      await client.query(
        `UPDATE routine_occurrences
         SET status = $1, completed_steps = $2, total_steps = $3, completed_at = $4, updated_at = NOW()
         WHERE id = $5`,
        [parentStatus, completedSteps, totalSteps, parentCompletedAt, cleanOccId]
      );

      await client.query("COMMIT");
      return this.findById(cleanOccId);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteFuturePendingByRoutineId(userId, routineId, afterProductDate) {
    const cleanUserId = normalizeUserId(userId);
    const cleanRoutineId = normalizeRoutineId(routineId);
    if (!cleanUserId || !cleanRoutineId || !afterProductDate) return 0;

    const db = getDrizzleDb();
    const deleted = await db
      .delete(routineOccurrences)
      .where(
        and(
          eq(routineOccurrences.userId, cleanUserId),
          eq(routineOccurrences.routineId, cleanRoutineId),
          eq(routineOccurrences.status, "pending"),
          sql`${routineOccurrences.productDate} > ${afterProductDate}`
        )
      )
      .returning();

    return deleted.length;
  }

  async deleteFuturePendingOnWeekdays(userId, routineId, afterProductDate, excludedIsoWeekdays = []) {
    if (!excludedIsoWeekdays.length) return 0;
    const cleanUserId = normalizeUserId(userId);
    const cleanRoutineId = normalizeRoutineId(routineId);
    if (!cleanUserId || !cleanRoutineId || !afterProductDate) return 0;

    const pool = getPgPool();
    // In PostgreSQL EXTRACT(ISODOW FROM product_date): 1=Mon .. 7=Sun
    const res = await pool.query(
      `DELETE FROM routine_occurrences
       WHERE user_id = $1 AND routine_id = $2 AND status = 'pending'
         AND product_date > $3
         AND EXTRACT(ISODOW FROM product_date)::int = ANY($4)
       RETURNING id`,
      [cleanUserId, cleanRoutineId, afterProductDate, excludedIsoWeekdays]
    );

    return res.rows.length;
  }

  async refreshFuturePendingSnapshots(userId, routineId, afterProductDate, newTitle, newGoalId, newStepsData = []) {
    const cleanUserId = normalizeUserId(userId);
    const cleanRoutineId = normalizeRoutineId(routineId);
    if (!cleanUserId || !cleanRoutineId || !afterProductDate) return 0;

    const pool = getPgPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Find all future unstarted occurrences
      const occsRes = await client.query(
        `SELECT id FROM routine_occurrences
         WHERE user_id = $1 AND routine_id = $2 AND status = 'pending' AND product_date > $3`,
        [cleanUserId, cleanRoutineId, afterProductDate]
      );

      const totalSteps = Math.max(1, newStepsData.length);
      const title = String(newTitle || "Routine").trim().slice(0, 150);
      const goalId = newGoalId ? normalizeRoutineId(newGoalId) : null;

      for (const row of occsRes.rows) {
        const occId = row.id;

        // Update occurrence snapshot
        await client.query(
          `UPDATE routine_occurrences
           SET snapshot_title = $1, snapshot_goal_id = $2, total_steps = $3, updated_at = NOW()
           WHERE id = $4`,
          [title, goalId, totalSteps, occId]
        );

        // Delete existing unstarted step instances
        await client.query(
          "DELETE FROM routine_step_occurrences WHERE occurrence_id = $1",
          [occId]
        );

        // Re-populate from new step definition
        for (let i = 0; i < newStepsData.length; i++) {
          const s = newStepsData[i];
          const stepTitle = String(s.title || `Step ${i + 1}`).trim().slice(0, 150);
          const sortOrder = Number(s.sortOrder ?? i);
          const origStepId = s.id ? normalizeRoutineId(s.id) : null;

          await client.query(
            `INSERT INTO routine_step_occurrences (
              id, occurrence_id, step_id, title, sort_order, status, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, 'pending', NOW(), NOW()
            )`,
            [occId, origStepId, stepTitle, sortOrder]
          );
        }
      }

      await client.query("COMMIT");
      return occsRes.rows.length;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async evaluateMissedOccurrences(userId, beforeProductDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !beforeProductDate) return 0;
    const cleanDate = typeof beforeProductDate === "string" ? beforeProductDate.slice(0, 10) : beforeProductDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();

    // Idempotently transition unfinalized past occurrences (pending or in_progress) to missed
    const result = await db
      .update(routineOccurrences)
      .set({
        status: "missed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(routineOccurrences.userId, cleanUserId),
          sql`${routineOccurrences.productDate} < ${cleanDate}::date`,
          inArray(routineOccurrences.status, ["pending", "in_progress"])
        )
      )
      .returning();

    return result.length;
  }

  async findPastOccurrences(userId, beforeProductDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !beforeProductDate) return [];
    const cleanDate = typeof beforeProductDate === "string" ? beforeProductDate.slice(0, 10) : beforeProductDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();

    const rows = await db
      .select({
        id: routineOccurrences.id,
        userId: routineOccurrences.userId,
        routineId: routineOccurrences.routineId,
        productDate: routineOccurrences.productDate,
        status: routineOccurrences.status,
        completedAt: routineOccurrences.completedAt,
        totalSteps: routineOccurrences.totalSteps,
        completedSteps: routineOccurrences.completedSteps,
        snapshotTitle: routineOccurrences.snapshotTitle,
        snapshotGoalId: routineOccurrences.snapshotGoalId,
        createdAt: routineOccurrences.createdAt,
        updatedAt: routineOccurrences.updatedAt,
        targetTime: routines.targetTime,
        estimatedMinutes: routines.estimatedMinutes,
        routineStatus: routines.status,
      })
      .from(routineOccurrences)
      .leftJoin(routines, eq(routineOccurrences.routineId, routines.id))
      .where(
        and(
          eq(routineOccurrences.userId, cleanUserId),
          sql`${routineOccurrences.productDate} < ${cleanDate}::date`
        )
      )
      .orderBy(asc(routineOccurrences.productDate));

    return rows.map((r) => toDomainOccurrence(r, []));
  }

  async findByUserAndDateRange(userId, startDate, endDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];
    const db = getDrizzleDb();
    const conditions = [eq(routineOccurrences.userId, cleanUserId)];

    if (startDate) {
      const s = typeof startDate === "string" ? startDate.slice(0, 10) : startDate.toISOString().slice(0, 10);
      conditions.push(gte(routineOccurrences.productDate, s));
    }
    if (endDate) {
      const e = typeof endDate === "string" ? endDate.slice(0, 10) : endDate.toISOString().slice(0, 10);
      conditions.push(lte(routineOccurrences.productDate, e));
    }

    const rows = await db
      .select({
        id: routineOccurrences.id,
        userId: routineOccurrences.userId,
        routineId: routineOccurrences.routineId,
        productDate: routineOccurrences.productDate,
        status: routineOccurrences.status,
        completedAt: routineOccurrences.completedAt,
        totalSteps: routineOccurrences.totalSteps,
        completedSteps: routineOccurrences.completedSteps,
        snapshotTitle: routineOccurrences.snapshotTitle,
        snapshotGoalId: routineOccurrences.snapshotGoalId,
        createdAt: routineOccurrences.createdAt,
        updatedAt: routineOccurrences.updatedAt,
        targetTime: routines.targetTime,
        estimatedMinutes: routines.estimatedMinutes,
        routineStatus: routines.status,
      })
      .from(routineOccurrences)
      .leftJoin(routines, eq(routineOccurrences.routineId, routines.id))
      .where(and(...conditions))
      .orderBy(asc(routineOccurrences.productDate));

    return rows.map((r) => toDomainOccurrence(r, []));
  }
}

export const routineOccurrenceRepository = new RoutineOccurrenceRepository();
export default routineOccurrenceRepository;
