import { eq, and, asc, sql, inArray } from "drizzle-orm";
import { getDrizzleDb, getPgPool } from "../db/index.js";
import { tasks } from "../db/schema/tasks.js";
import { normalizeUserId } from "./userRepository.js";
import { normalizeGoalId } from "./goalRepository.js";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeTaskId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

export function toDomainTask(row) {
  if (!row) return null;
  const pDate = row.plannedProductDate instanceof Date
    ? row.plannedProductDate.toISOString().slice(0, 10)
    : (row.plannedProductDate ? String(row.plannedProductDate).slice(0, 10) : null);
  const dDate = row.dueDate instanceof Date
    ? row.dueDate.toISOString().slice(0, 10)
    : (row.dueDate ? String(row.dueDate).slice(0, 10) : null);

  return {
    id: row.id,
    _id: row.id,
    user: row.userId,
    userId: row.userId,
    goal: row.goalId,
    goalId: row.goalId,
    title: row.title,
    description: row.description || "",
    status: row.status || "todo",
    priority: row.priority || "medium",
    order: row.orderIndex ?? 0,
    orderIndex: row.orderIndex ?? 0,
    dueDate: dDate,
    plannedDate: pDate ? new Date(`${pDate}T00:00:00.000Z`) : null,
    customPlannedDate: pDate,
    plannedProductDate: pDate,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function formatPgDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

class TaskRepository {
  async findById(userId, taskId) {
    const cleanTaskId = normalizeTaskId(taskId || userId);
    const cleanUserId = taskId ? normalizeUserId(userId) : null;
    if (!cleanTaskId) return null;

    const db = getDrizzleDb();
    const condition = cleanUserId
      ? and(eq(tasks.id, cleanTaskId), eq(tasks.userId, cleanUserId))
      : eq(tasks.id, cleanTaskId);

    const rows = await db.select().from(tasks).where(condition).limit(1);
    return toDomainTask(rows[0]);
  }

  async findByUserId(userId) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, cleanUserId))
      .orderBy(asc(tasks.orderIndex));
    return rows.map(toDomainTask);
  }

  async findByGoalId(goalId) {
    const cleanGoalId = normalizeGoalId(goalId);
    if (!cleanGoalId) return [];
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.goalId, cleanGoalId));
    return rows.map(toDomainTask);
  }

  async findByIds(userId, taskIds) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !Array.isArray(taskIds) || taskIds.length === 0) return [];
    const cleanTaskIds = taskIds.map(normalizeTaskId).filter(Boolean);
    if (cleanTaskIds.length === 0) return [];

    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, cleanUserId), inArray(tasks.id, cleanTaskIds)));
    return rows.map(toDomainTask);
  }

  async create(userId, data) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) throw new Error("Valid userId required to create task");

    const cleanGoalId = data.goal || data.goalId ? normalizeGoalId(data.goal || data.goalId) : null;
    const pDate = formatPgDate(data.customPlannedDate || data.plannedDate);
    const dDate = formatPgDate(data.dueDate);

    const validStatuses = ["todo", "in-progress", "completed", "cancelled"];
    const validPriorities = ["low", "medium", "high"];

    const db = getDrizzleDb();
    const rows = await db
      .insert(tasks)
      .values({
        userId: cleanUserId,
        goalId: cleanGoalId,
        title: (data.title || "").trim().slice(0, 200),
        description: data.description || "",
        status: validStatuses.includes(data.status) ? data.status : "todo",
        priority: validPriorities.includes(data.priority) ? data.priority : "medium",
        orderIndex: typeof data.order === "number" ? data.order : (data.orderIndex ?? 0),
        dueDate: dDate,
        plannedProductDate: pDate,
        tags: Array.isArray(data.tags) ? data.tags.filter(t => typeof t === "string") : [],
      })
      .returning();
    return toDomainTask(rows[0]);
  }

  async update(userId, taskId, data) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanTaskId) return null;

    const db = getDrizzleDb();
    const fieldsToSet = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) fieldsToSet.title = data.title.trim().slice(0, 200);
    if (data.description !== undefined) fieldsToSet.description = data.description;
    if (data.status !== undefined && ["todo", "in-progress", "completed", "cancelled"].includes(data.status)) {
      fieldsToSet.status = data.status;
    }
    if (data.priority !== undefined && ["low", "medium", "high"].includes(data.priority)) {
      fieldsToSet.priority = data.priority;
    }
    if (data.order !== undefined || data.orderIndex !== undefined) {
      fieldsToSet.orderIndex = Number(data.order ?? data.orderIndex) || 0;
    }
    if (data.goal !== undefined || data.goalId !== undefined) {
      const g = data.goal !== undefined ? data.goal : data.goalId;
      fieldsToSet.goalId = g ? normalizeGoalId(g) : null;
    }
    if (data.customPlannedDate !== undefined || data.plannedDate !== undefined) {
      const p = data.customPlannedDate !== undefined ? data.customPlannedDate : data.plannedDate;
      fieldsToSet.plannedProductDate = formatPgDate(p);
    }
    if (data.dueDate !== undefined) {
      fieldsToSet.dueDate = formatPgDate(data.dueDate);
    }
    if (data.tags !== undefined) {
      fieldsToSet.tags = Array.isArray(data.tags) ? data.tags.filter(t => typeof t === "string") : [];
    }

    const condition = cleanUserId
      ? and(eq(tasks.id, cleanTaskId), eq(tasks.userId, cleanUserId))
      : eq(tasks.id, cleanTaskId);

    const rows = await db
      .update(tasks)
      .set(fieldsToSet)
      .where(condition)
      .returning();
    return toDomainTask(rows[0]);
  }

  async delete(userId, taskId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanTaskId) return null;

    const db = getDrizzleDb();
    const condition = cleanUserId
      ? and(eq(tasks.id, cleanTaskId), eq(tasks.userId, cleanUserId))
      : eq(tasks.id, cleanTaskId);

    const rows = await db.delete(tasks).where(condition).returning();
    return toDomainTask(rows[0]);
  }

  async reorder(userId, updates) {
    if (!Array.isArray(updates) || updates.length === 0) return;
    const cleanUserId = normalizeUserId(userId);
    const pool = getPgPool();
    const client = await pool.connect();

    // Sort by taskId to enforce consistent lock acquisition order and prevent deadlocks
    const validUpdates = updates
      .map((u) => ({ taskId: normalizeTaskId(u.taskId), order: Number(u.order) || 0 }))
      .filter((u) => !!u.taskId)
      .sort((a, b) => a.taskId.localeCompare(b.taskId));

    try {
      await client.query("BEGIN");
      for (const u of validUpdates) {
        await client.query(
          "UPDATE tasks SET order_index = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
          [u.order, u.taskId, cleanUserId]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

export const taskRepository = new TaskRepository();
export default taskRepository;
