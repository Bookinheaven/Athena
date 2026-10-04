import { eq, and, desc } from "drizzle-orm";
import { getDrizzleDb } from "../db/index.js";
import { goals } from "../db/schema/goals.js";
import { normalizeUserId } from "./userRepository.js";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeGoalId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

export function toDomainGoal(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    user: row.userId,
    userId: row.userId,
    title: row.title,
    description: row.description || "",
    status: row.status || "active",
    progress: Number(row.progress ?? 0),
    color: row.color || "#6366f1",
    startDate: row.startDate,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class GoalRepository {
  async findByUserId(userId) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, cleanUserId))
      .orderBy(desc(goals.createdAt));
    return rows.map(toDomainGoal);
  }

  async findById(userId, goalId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanGoalId = normalizeGoalId(goalId);
    if (!cleanGoalId) return null;

    const db = getDrizzleDb();
    const condition = cleanUserId
      ? and(eq(goals.id, cleanGoalId), eq(goals.userId, cleanUserId))
      : eq(goals.id, cleanGoalId);

    const rows = await db.select().from(goals).where(condition).limit(1);
    return toDomainGoal(rows[0]);
  }

  async create(userId, data) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) throw new Error("Valid userId required to create goal");

    const db = getDrizzleDb();
    let progress = 0;
    if (typeof data.progress === "number" && !isNaN(data.progress)) {
      progress = Math.min(100, Math.max(0, data.progress));
    }

    const rows = await db
      .insert(goals)
      .values({
        userId: cleanUserId,
        title: (data.title || "").trim().slice(0, 120),
        description: data.description || "",
        status: ["active", "completed", "archived"].includes(data.status)
          ? data.status
          : "active",
        progress: progress.toFixed(2),
        color: data.color && /^#[0-9a-fA-F]{6}$/.test(data.color) ? data.color : "#6366f1",
        startDate: data.startDate ? String(data.startDate).slice(0, 10) : null,
        dueDate: data.dueDate ? String(data.dueDate).slice(0, 10) : null,
      })
      .returning();
    return toDomainGoal(rows[0]);
  }

  async update(userId, goalId, data) {
    const cleanUserId = normalizeUserId(userId);
    const cleanGoalId = normalizeGoalId(goalId);
    if (!cleanGoalId) return null;

    const db = getDrizzleDb();
    const fieldsToSet = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) fieldsToSet.title = data.title.trim().slice(0, 120);
    if (data.description !== undefined) fieldsToSet.description = data.description;
    if (data.status !== undefined && ["active", "completed", "archived"].includes(data.status)) {
      fieldsToSet.status = data.status;
    }
    if (data.progress !== undefined) {
      const p = Math.min(100, Math.max(0, Number(data.progress) || 0));
      fieldsToSet.progress = p.toFixed(2);
    }
    if (data.color !== undefined && /^#[0-9a-fA-F]{6}$/.test(data.color)) {
      fieldsToSet.color = data.color;
    }
    if (data.startDate !== undefined) {
      fieldsToSet.startDate = data.startDate ? String(data.startDate).slice(0, 10) : null;
    }
    if (data.dueDate !== undefined) {
      fieldsToSet.dueDate = data.dueDate ? String(data.dueDate).slice(0, 10) : null;
    }

    const condition = cleanUserId
      ? and(eq(goals.id, cleanGoalId), eq(goals.userId, cleanUserId))
      : eq(goals.id, cleanGoalId);

    const rows = await db
      .update(goals)
      .set(fieldsToSet)
      .where(condition)
      .returning();
    return toDomainGoal(rows[0]);
  }

  async delete(userId, goalId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanGoalId = normalizeGoalId(goalId);
    if (!cleanGoalId) return null;

    const db = getDrizzleDb();
    const condition = cleanUserId
      ? and(eq(goals.id, cleanGoalId), eq(goals.userId, cleanUserId))
      : eq(goals.id, cleanGoalId);

    const rows = await db.delete(goals).where(condition).returning();
    return toDomainGoal(rows[0]);
  }

  async updateProgress(goalId, progress) {
    const cleanGoalId = normalizeGoalId(goalId);
    if (!cleanGoalId) return null;
    const db = getDrizzleDb();
    const p = Math.min(100, Math.max(0, Number(progress) || 0));

    const rows = await db
      .update(goals)
      .set({
        progress: p.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(goals.id, cleanGoalId))
      .returning();
    return toDomainGoal(rows[0]);
  }
}

export const goalRepository = new GoalRepository();
export default goalRepository;
