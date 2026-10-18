import { eq, and, asc, desc, inArray, sql } from "drizzle-orm";
import { getDrizzleDb, getPgPool } from "../db/index.js";
import { routines } from "../db/schema/routines.js";
import { routineSteps } from "../db/schema/routineSteps.js";
import { normalizeUserId } from "./userRepository.js";
import { normalizeGoalId } from "./goalRepository.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeRoutineId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

export function normalizeStepId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

export function toDomainStep(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    routineId: row.routineId ?? row.routine_id,
    title: row.title,
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0),
    estimatedMinutes: row.estimatedMinutes ?? row.estimated_minutes ?? null,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

export function toDomainRoutine(row, steps = []) {
  if (!row) return null;
  const rawDate = row.startProductDate ?? row.start_product_date;
  const pDate =
    rawDate instanceof Date
      ? rawDate.toISOString().slice(0, 10)
      : rawDate
      ? String(rawDate).slice(0, 10)
      : null;

  const rawRecurrenceDays = row.recurrenceDays ?? row.recurrence_days;

  return {
    id: row.id,
    _id: row.id,
    userId: row.userId ?? row.user_id,
    user: row.userId ?? row.user_id,
    goalId: row.goalId ?? row.goal_id ?? null,
    goal: row.goalId ?? row.goal_id ?? null,
    title: row.title,
    description: row.description || "",
    status: row.status || "active",
    recurrenceType: row.recurrenceType ?? row.recurrence_type ?? "daily",
    recurrenceDays: Array.isArray(rawRecurrenceDays) ? rawRecurrenceDays : [1, 2, 3, 4, 5, 6, 7],
    startProductDate: pDate,
    estimatedMinutes: Number(row.estimatedMinutes ?? row.estimated_minutes ?? 15),
    targetTime: row.targetTime ?? row.target_time ?? null,
    steps: Array.isArray(steps) ? steps.map(toDomainStep) : [],
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

class RoutineRepository {
  async findById(userId, routineId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanRoutineId = normalizeRoutineId(routineId);
    if (!cleanUserId || !cleanRoutineId) return null;

    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(routines)
      .where(and(eq(routines.id, cleanRoutineId), eq(routines.userId, cleanUserId)))
      .limit(1);

    if (!rows.length) return null;

    const steps = await db
      .select()
      .from(routineSteps)
      .where(eq(routineSteps.routineId, cleanRoutineId))
      .orderBy(asc(routineSteps.sortOrder));

    return toDomainRoutine(rows[0], steps);
  }

  async findByUserId(userId, options = {}) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];

    const db = getDrizzleDb();
    const conditions = [eq(routines.userId, cleanUserId)];

    if (!options.includeArchived) {
      conditions.push(sql`${routines.status} != 'archived'`);
    }
    if (options.status) {
      conditions.push(eq(routines.status, options.status));
    }

    const rows = await db
      .select()
      .from(routines)
      .where(and(...conditions))
      .orderBy(desc(routines.createdAt));

    if (!rows.length) return [];

    const routineIds = rows.map((r) => r.id);
    const allSteps = await db
      .select()
      .from(routineSteps)
      .where(inArray(routineSteps.routineId, routineIds))
      .orderBy(asc(routineSteps.sortOrder));

    const stepsByRoutine = new Map();
    for (const step of allSteps) {
      if (!stepsByRoutine.has(step.routineId)) {
        stepsByRoutine.set(step.routineId, []);
      }
      stepsByRoutine.get(step.routineId).push(step);
    }

    return rows.map((r) => toDomainRoutine(r, stepsByRoutine.get(r.id) || []));
  }

  async findActiveRoutinesForUser(userId) {
    return this.findByUserId(userId, { status: "active" });
  }

  async create(userId, routineData, stepsData = []) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) throw new Error("Valid userId required");

    const pool = getPgPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const cleanGoalId = routineData.goalId ? normalizeGoalId(routineData.goalId) : null;
      const title = String(routineData.title || "").trim().slice(0, 150);
      const description = String(routineData.description || "");
      const status = routineData.status || "active";
      const recurrenceType = routineData.recurrenceType === "selected_days" ? "selected_days" : "daily";
      const recurrenceDays = Array.isArray(routineData.recurrenceDays) && routineData.recurrenceDays.length > 0
        ? routineData.recurrenceDays.map(Number)
        : [1, 2, 3, 4, 5, 6, 7];
      const startProductDate = String(routineData.startProductDate || "").slice(0, 10);
      const estimatedMinutes = Math.max(1, Number(routineData.estimatedMinutes) || 15);
      const targetTime = routineData.targetTime ? String(routineData.targetTime).slice(0, 5) : null;

      const routineRes = await client.query(
        `INSERT INTO routines (
          id, user_id, goal_id, title, description, status, recurrence_type,
          recurrence_days, start_product_date, estimated_minutes, target_time,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
        ) RETURNING *`,
        [
          cleanUserId,
          cleanGoalId,
          title,
          description,
          status,
          recurrenceType,
          recurrenceDays,
          startProductDate,
          estimatedMinutes,
          targetTime,
        ]
      );

      const routineRow = routineRes.rows[0];
      const createdSteps = [];

      for (let i = 0; i < stepsData.length; i++) {
        const step = stepsData[i];
        const stepTitle = String(step.title || `Step ${i + 1}`).trim().slice(0, 150);
        const sortOrder = Number(step.sortOrder ?? i);
        const stepEst = step.estimatedMinutes ? Math.max(1, Number(step.estimatedMinutes)) : null;

        const stepRes = await client.query(
          `INSERT INTO routine_steps (
            id, routine_id, title, sort_order, estimated_minutes, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()
          ) RETURNING *`,
          [routineRow.id, stepTitle, sortOrder, stepEst]
        );
        createdSteps.push(stepRes.rows[0]);
      }

      await client.query("COMMIT");
      return toDomainRoutine(routineRow, createdSteps);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async update(userId, routineId, updateData, stepsData = null) {
    const cleanUserId = normalizeUserId(userId);
    const cleanRoutineId = normalizeRoutineId(routineId);
    if (!cleanUserId || !cleanRoutineId) return null;

    const pool = getPgPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Verify ownership
      const existingRes = await client.query(
        "SELECT * FROM routines WHERE id = $1 AND user_id = $2 FOR UPDATE",
        [cleanRoutineId, cleanUserId]
      );
      if (!existingRes.rows.length) {
        await client.query("ROLLBACK");
        return null;
      }

      const existing = existingRes.rows[0];
      const title = updateData.title !== undefined ? String(updateData.title).trim().slice(0, 150) : existing.title;
      const description = updateData.description !== undefined ? String(updateData.description) : existing.description;
      const status = updateData.status !== undefined ? updateData.status : existing.status;
      const recurrenceType = updateData.recurrenceType !== undefined ? updateData.recurrenceType : existing.recurrence_type;
      const recurrenceDays = updateData.recurrenceDays !== undefined ? updateData.recurrenceDays.map(Number) : existing.recurrence_days;
      const estimatedMinutes = updateData.estimatedMinutes !== undefined ? Math.max(1, Number(updateData.estimatedMinutes)) : existing.estimated_minutes;
      const targetTime = updateData.targetTime !== undefined ? (updateData.targetTime ? String(updateData.targetTime).slice(0, 5) : null) : existing.target_time;
      const goalId = updateData.goalId !== undefined ? (updateData.goalId ? normalizeGoalId(updateData.goalId) : null) : existing.goal_id;

      const updateRes = await client.query(
        `UPDATE routines SET
          title = $1, description = $2, status = $3, recurrence_type = $4,
          recurrence_days = $5, estimated_minutes = $6, target_time = $7,
          goal_id = $8, updated_at = NOW()
        WHERE id = $9 AND user_id = $10
        RETURNING *`,
        [
          title,
          description,
          status,
          recurrenceType,
          recurrenceDays,
          estimatedMinutes,
          targetTime,
          goalId,
          cleanRoutineId,
          cleanUserId,
        ]
      );

      let stepRows = [];
      if (Array.isArray(stepsData)) {
        // Replace steps
        await client.query("DELETE FROM routine_steps WHERE routine_id = $1", [cleanRoutineId]);

        for (let i = 0; i < stepsData.length; i++) {
          const step = stepsData[i];
          const stepTitle = String(step.title || `Step ${i + 1}`).trim().slice(0, 150);
          const sortOrder = Number(step.sortOrder ?? i);
          const stepEst = step.estimatedMinutes ? Math.max(1, Number(step.estimatedMinutes)) : null;

          const stepRes = await client.query(
            `INSERT INTO routine_steps (
              id, routine_id, title, sort_order, estimated_minutes, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()
            ) RETURNING *`,
            [cleanRoutineId, stepTitle, sortOrder, stepEst]
          );
          stepRows.push(stepRes.rows[0]);
        }
      } else {
        const existingStepsRes = await client.query(
          "SELECT * FROM routine_steps WHERE routine_id = $1 ORDER BY sort_order ASC",
          [cleanRoutineId]
        );
        stepRows = existingStepsRes.rows;
      }

      await client.query("COMMIT");
      return toDomainRoutine(updateRes.rows[0], stepRows);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async updateStatus(userId, routineId, status) {
    const cleanUserId = normalizeUserId(userId);
    const cleanRoutineId = normalizeRoutineId(routineId);
    if (!cleanUserId || !cleanRoutineId) return null;

    const db = getDrizzleDb();
    const rows = await db
      .update(routines)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(routines.id, cleanRoutineId), eq(routines.userId, cleanUserId)))
      .returning();

    if (!rows.length) return null;
    return this.findById(userId, cleanRoutineId);
  }

  async delete(userId, routineId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanRoutineId = normalizeRoutineId(routineId);
    if (!cleanUserId || !cleanRoutineId) return false;

    const db = getDrizzleDb();
    // Cascades to routine_steps; routine_occurrences.routine_id becomes null (set null)
    const rows = await db
      .delete(routines)
      .where(and(eq(routines.id, cleanRoutineId), eq(routines.userId, cleanUserId)))
      .returning();

    return rows.length > 0;
  }
}

export const routineRepository = new RoutineRepository();
export default routineRepository;
