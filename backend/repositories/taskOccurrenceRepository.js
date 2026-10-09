import { eq, and, or, inArray, asc, desc, lte, gte, sql } from "drizzle-orm";
import { getDrizzleDb, getPgPool } from "../db/index.js";
import { taskOccurrences } from "../db/schema/taskOccurrences.js";
import { normalizeUserId } from "./userRepository.js";
import { normalizeTaskId } from "./taskRepository.js";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeOccurrenceId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

export function toDomainOccurrence(row) {
  if (!row) return null;
  const pDate = row.productDate instanceof Date
    ? row.productDate.toISOString().slice(0, 10)
    : String(row.productDate).slice(0, 10);
  const rDate = row.rescheduledToDate instanceof Date
    ? row.rescheduledToDate.toISOString().slice(0, 10)
    : (row.rescheduledToDate ? String(row.rescheduledToDate).slice(0, 10) : null);

  return {
    id: row.id,
    _id: row.id,
    userId: row.userId,
    taskId: row.taskId,
    date: pDate ? new Date(`${pDate}T00:00:00.000Z`) : null,
    productDate: pDate,
    outcome: row.outcome,
    rescheduledTo: rDate,
    rescheduledToDate: rDate,
    completedAt: row.completedAt,
    notes: row.notes || "",
    taskSnapshot: {
      title: row.snapshotTitle,
      priority: row.snapshotPriority || "medium",
    },
    snapshotTitle: row.snapshotTitle,
    snapshotPriority: row.snapshotPriority || "medium",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class TaskOccurrenceRepository {
  async findById(occurrenceId) {
    const cleanId = normalizeOccurrenceId(occurrenceId);
    if (!cleanId) return null;
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(taskOccurrences)
      .where(eq(taskOccurrences.id, cleanId))
      .limit(1);
    return toDomainOccurrence(rows[0]);
  }

  async findUserTaskOccurrenceOnDate(userId, taskId, productDate) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanUserId || !cleanTaskId || !productDate) return null;

    const cleanDate = typeof productDate === "string" ? productDate.slice(0, 10) : productDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(taskOccurrences)
      .where(
        and(
          eq(taskOccurrences.userId, cleanUserId),
          eq(taskOccurrences.taskId, cleanTaskId),
          eq(taskOccurrences.productDate, cleanDate)
        )
      )
      .limit(1);
    return toDomainOccurrence(rows[0]);
  }

  async findByUserAndDate(userId, productDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !productDate) return [];
    const cleanDate = typeof productDate === "string" ? productDate.slice(0, 10) : productDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(taskOccurrences)
      .where(
        and(
          eq(taskOccurrences.userId, cleanUserId),
          eq(taskOccurrences.productDate, cleanDate)
        )
      )
      .orderBy(asc(taskOccurrences.createdAt));
    return rows.map(toDomainOccurrence);
  }

  async findByUserAndDateRange(userId, startDate, endDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];
    const db = getDrizzleDb();
    const conditions = [eq(taskOccurrences.userId, cleanUserId)];

    if (startDate) {
      const s = typeof startDate === "string" ? startDate.slice(0, 10) : startDate.toISOString().slice(0, 10);
      conditions.push(gte(taskOccurrences.productDate, s));
    }
    if (endDate) {
      const e = typeof endDate === "string" ? endDate.slice(0, 10) : endDate.toISOString().slice(0, 10);
      conditions.push(lte(taskOccurrences.productDate, e));
    }

    const rows = await db
      .select()
      .from(taskOccurrences)
      .where(and(...conditions))
      .orderBy(asc(taskOccurrences.productDate));

    return rows.map(toDomainOccurrence);
  }

  async findByTaskId(taskId) {
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanTaskId) return [];
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(taskOccurrences)
      .where(eq(taskOccurrences.taskId, cleanTaskId))
      .orderBy(desc(taskOccurrences.productDate));
    return rows.map(toDomainOccurrence);
  }

  async findByUserAndTaskId(userId, taskId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanUserId || !cleanTaskId) return [];
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(taskOccurrences)
      .where(
        and(
          eq(taskOccurrences.userId, cleanUserId),
          eq(taskOccurrences.taskId, cleanTaskId)
        )
      )
      .orderBy(asc(taskOccurrences.productDate));
    return rows.map(toDomainOccurrence);
  }

  async upsert(userId, taskId, productDate, data = {}) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanUserId || !cleanTaskId || !productDate) {
      throw new Error("userId, taskId, and productDate are required for TaskOccurrence");
    }

    const cleanDate = typeof productDate === "string" ? productDate.slice(0, 10) : productDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();

    const snapshot = data.taskSnapshot || {};
    const title = (snapshot.title || data.title || "Untitled Task").slice(0, 200);
    const priority = ["low", "medium", "high"].includes(snapshot.priority)
      ? snapshot.priority
      : "medium";

    const cleanRescheduledDate = (val) => {
      if (!val) return null;
      if (val instanceof Date) return val.toISOString().slice(0, 10);
      return String(val).slice(0, 10);
    };

    const insertValues = {
      userId: cleanUserId,
      taskId: cleanTaskId,
      productDate: cleanDate,
      outcome: data.outcome || "pending",
      snapshotTitle: title,
      snapshotPriority: priority,
      notes: data.notes || "",
      completedAt: data.completedAt || null,
      rescheduledToDate: cleanRescheduledDate(data.rescheduledTo || data.rescheduledToDate),
    };

    const updateSet = {
      updatedAt: new Date(),
    };
    if (data.outcome !== undefined) updateSet.outcome = data.outcome;
    if (data.completedAt !== undefined) updateSet.completedAt = data.completedAt;
    if (data.notes !== undefined) updateSet.notes = data.notes;
    if (data.rescheduledTo !== undefined || data.rescheduledToDate !== undefined) {
      updateSet.rescheduledToDate = cleanRescheduledDate(data.rescheduledTo || data.rescheduledToDate);
    }
    if (title) updateSet.snapshotTitle = title;
    if (priority) updateSet.snapshotPriority = priority;

    const rows = await db
      .insert(taskOccurrences)
      .values(insertValues)
      .onConflictDoUpdate({
        target: [taskOccurrences.userId, taskOccurrences.taskId, taskOccurrences.productDate],
        set: updateSet,
      })
      .returning();

    return toDomainOccurrence(rows[0]);
  }

  async update(occurrenceId, updateData) {
    const cleanId = normalizeOccurrenceId(occurrenceId);
    if (!cleanId || !updateData) return null;
    const db = getDrizzleDb();

    const fieldsToSet = {
      updatedAt: new Date(),
    };
    if (updateData.outcome !== undefined) fieldsToSet.outcome = updateData.outcome;
    if (updateData.completedAt !== undefined) fieldsToSet.completedAt = updateData.completedAt;
    if (updateData.notes !== undefined) fieldsToSet.notes = updateData.notes;
    if (updateData.rescheduledTo !== undefined || updateData.rescheduledToDate !== undefined) {
      const r = updateData.rescheduledTo || updateData.rescheduledToDate;
      fieldsToSet.rescheduledToDate = r ? String(r).slice(0, 10) : null;
    }

    const rows = await db
      .update(taskOccurrences)
      .set(fieldsToSet)
      .where(eq(taskOccurrences.id, cleanId))
      .returning();

    return toDomainOccurrence(rows[0]);
  }

  async evaluateMissedOccurrences(userId, beforeProductDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !beforeProductDate) return 0;
    const cleanDate = typeof beforeProductDate === "string" ? beforeProductDate.slice(0, 10) : beforeProductDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();

    const result = await db
      .update(taskOccurrences)
      .set({
        outcome: "missed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(taskOccurrences.userId, cleanUserId),
          sql`${taskOccurrences.productDate} < ${cleanDate}::date`,
          eq(taskOccurrences.outcome, "pending")
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
      .select()
      .from(taskOccurrences)
      .where(
        and(
          eq(taskOccurrences.userId, cleanUserId),
          sql`${taskOccurrences.productDate} < ${cleanDate}::date`
        )
      )
      .orderBy(asc(taskOccurrences.productDate));
    return rows.map(toDomainOccurrence);
  }

  async hasHistoricalOccurrences(userId, taskId, todayProductDate) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanUserId || !cleanTaskId) return false;

    const db = getDrizzleDb();
    const todayStr = typeof todayProductDate === "string" 
      ? todayProductDate.slice(0, 10) 
      : todayProductDate.toISOString().slice(0, 10);

    const rows = await db
      .select({ count: sql`count(*)` })
      .from(taskOccurrences)
      .where(
        and(
          eq(taskOccurrences.userId, cleanUserId),
          eq(taskOccurrences.taskId, cleanTaskId),
          or(
            inArray(taskOccurrences.outcome, ["completed", "partially_completed", "rescheduled", "missed"]),
            sql`${taskOccurrences.productDate} < ${todayStr}::date`
          )
        )
      );

    return Number(rows[0]?.count) > 0;
  }

  async deletePendingByTaskId(userId, taskId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanUserId || !cleanTaskId) return 0;

    const db = getDrizzleDb();
    const rows = await db
      .delete(taskOccurrences)
      .where(
        and(
          eq(taskOccurrences.userId, cleanUserId),
          eq(taskOccurrences.taskId, cleanTaskId),
          eq(taskOccurrences.outcome, "pending")
        )
      )
      .returning();

    return rows.length;
  }

  async rolloverBatch(userId, fromProductDate, toProductDate, taskIds) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) {
      const err = new Error("Invalid userId");
      err.statusCode = 400;
      throw err;
    }
    const cleanFromDate = typeof fromProductDate === "string" ? fromProductDate.slice(0, 10) : fromProductDate.toISOString().slice(0, 10);
    const cleanToDate = typeof toProductDate === "string" ? toProductDate.slice(0, 10) : toProductDate.toISOString().slice(0, 10);

    const pool = getPgPool();
    const client = await pool.connect();

    const rolledOver = [];
    const skipped = [];
    const errors = [];

    const toDateStr = (val) => {
      if (!val) return null;
      if (typeof val === "string") return val.slice(0, 10);
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, "0");
        const d = String(val.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
      return String(val).slice(0, 10);
    };

    try {
      await client.query("BEGIN");

      for (const rawTaskId of taskIds) {
        const cleanTaskId = normalizeTaskId(rawTaskId);
        if (!cleanTaskId) {
          const err = new Error("Invalid taskId format");
          err.statusCode = 400;
          throw err;
        }

        // 1. Verify task belongs to user
        const taskRes = await client.query(
          "SELECT id, user_id, title, priority, planned_product_date FROM tasks WHERE id = $1",
          [cleanTaskId]
        );
        if (taskRes.rows.length === 0) {
          const err = new Error("Task not found or access denied");
          err.statusCode = 404;
          throw err;
        }
        const taskRow = taskRes.rows[0];
        if (String(taskRow.user_id) !== String(cleanUserId)) {
          const err = new Error("Task not found or access denied");
          err.statusCode = 404;
          throw err;
        }

        // 2. Fetch occurrence on source date
        const occRes = await client.query(
          "SELECT id, outcome, rescheduled_to_date, snapshot_title, snapshot_priority FROM task_occurrences WHERE user_id = $1 AND task_id = $2 AND product_date = $3",
          [cleanUserId, cleanTaskId, cleanFromDate]
        );

        if (occRes.rows.length === 0) {
          const pDate = toDateStr(taskRow.planned_product_date);

          if (pDate === cleanFromDate) {
            await client.query(
              `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, rescheduled_to_date, snapshot_title, snapshot_priority, created_at, updated_at)
               VALUES (gen_random_uuid(), $1, $2, $3, 'rescheduled', $4, $5, $6, NOW(), NOW())
               ON CONFLICT (user_id, task_id, product_date) DO UPDATE
               SET outcome = 'rescheduled', rescheduled_to_date = $4, updated_at = NOW()`,
              [cleanUserId, cleanTaskId, cleanFromDate, cleanToDate, taskRow.title, taskRow.priority || "medium"]
            );
          } else {
            skipped.push({ taskId: cleanTaskId, title: taskRow.title, reason: "No occurrence found on source date" });
            continue;
          }
        } else {
          const occRow = occRes.rows[0];

          if (occRow.outcome === "completed") {
            skipped.push({ taskId: cleanTaskId, title: taskRow.title, reason: "Task occurrence is already completed" });
            continue;
          }
          if (occRow.outcome === "cancelled") {
            skipped.push({ taskId: cleanTaskId, title: taskRow.title, reason: "Task occurrence is cancelled" });
            continue;
          }
          if (occRow.outcome === "rescheduled") {
            const rDate = toDateStr(occRow.rescheduled_to_date);

            if (rDate === cleanToDate) {
              skipped.push({ taskId: cleanTaskId, title: taskRow.title, reason: "Already rolled over to destination date" });
              continue;
            } else {
              skipped.push({ taskId: cleanTaskId, title: taskRow.title, reason: `Task occurrence already rescheduled to ${rDate}` });
              continue;
            }
          }

          // Eligible: 'pending' or 'missed'
          await client.query(
            `UPDATE task_occurrences
             SET outcome = 'rescheduled', rescheduled_to_date = $1, updated_at = NOW()
             WHERE id = $2`,
            [cleanToDate, occRow.id]
          );
        }

        // 3. Update task's planned date to destination date
        await client.query(
          `UPDATE tasks
           SET planned_product_date = $1, updated_at = NOW()
           WHERE id = $2 AND user_id = $3`,
          [cleanToDate, cleanTaskId, cleanUserId]
        );

        // 4. Create/retain destination occurrence on toProductDate as 'pending'
        await client.query(
          `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, snapshot_title, snapshot_priority, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, 'pending', $4, $5, NOW(), NOW())
           ON CONFLICT (user_id, task_id, product_date) DO UPDATE
           SET outcome = CASE WHEN task_occurrences.outcome IN ('rescheduled', 'missed') THEN 'pending' ELSE task_occurrences.outcome END,
               updated_at = NOW()`,
          [cleanUserId, cleanTaskId, cleanToDate, taskRow.title, taskRow.priority || "medium"]
        );

        rolledOver.push({
          taskId: cleanTaskId,
          title: taskRow.title,
          fromProductDate: cleanFromDate,
          toProductDate: cleanToDate,
        });
      }

      await client.query("COMMIT");
      return { rolledOver, skipped, errors };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

export const taskOccurrenceRepository = new TaskOccurrenceRepository();
export default taskOccurrenceRepository;
