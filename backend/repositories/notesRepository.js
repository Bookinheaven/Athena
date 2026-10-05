import { eq, and, desc } from "drizzle-orm";
import { getDrizzleDb } from "../db/index.js";
import { notes } from "../db/schema/notes.js";
import { normalizeUserId } from "./userRepository.js";
import { normalizeGoalId } from "./goalRepository.js";
import { normalizeTaskId } from "./taskRepository.js";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeNoteId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

export function toDomainNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    userId: row.userId,
    user: row.userId,
    goalId: row.goalId,
    goal: row.goalId,
    taskId: row.taskId,
    task: row.taskId,
    title: row.title || "",
    content: row.content || "",
    isPinned: Boolean(row.isPinned),
    pinned: Boolean(row.isPinned),
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class NotesRepository {
  async findByUserId(userId) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, cleanUserId))
      .orderBy(desc(notes.updatedAt));
    return rows.map(toDomainNote);
  }

  async findById(userId, noteId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanNoteId = normalizeNoteId(noteId);
    if (!cleanNoteId) return null;

    const db = getDrizzleDb();
    const condition = cleanUserId
      ? and(eq(notes.id, cleanNoteId), eq(notes.userId, cleanUserId))
      : eq(notes.id, cleanNoteId);

    const rows = await db.select().from(notes).where(condition).limit(1);
    return toDomainNote(rows[0]);
  }

  async findByTaskId(userId, taskId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanUserId || !cleanTaskId) return [];

    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, cleanUserId), eq(notes.taskId, cleanTaskId)))
      .orderBy(desc(notes.updatedAt));
    return rows.map(toDomainNote);
  }

  async findByGoalId(userId, goalId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanGoalId = normalizeGoalId(goalId);
    if (!cleanUserId || !cleanGoalId) return [];

    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, cleanUserId), eq(notes.goalId, cleanGoalId)))
      .orderBy(desc(notes.updatedAt));
    return rows.map(toDomainNote);
  }

  async create(userId, data) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) throw new Error("Valid userId required to create note");

    const cleanGoalId = data.goal || data.goalId ? normalizeGoalId(data.goal || data.goalId) : null;
    const cleanTaskId = data.task || data.taskId ? normalizeTaskId(data.task || data.taskId) : null;

    const db = getDrizzleDb();
    const rows = await db
      .insert(notes)
      .values({
        userId: cleanUserId,
        goalId: cleanGoalId,
        taskId: cleanTaskId,
        title: (data.title || "").trim().slice(0, 200),
        content: data.content || "",
        isPinned: Boolean(data.isPinned ?? data.pinned),
        tags: Array.isArray(data.tags) ? data.tags.filter(t => typeof t === "string") : [],
      })
      .returning();
    return toDomainNote(rows[0]);
  }

  async update(userId, noteId, data) {
    const cleanUserId = normalizeUserId(userId);
    const cleanNoteId = normalizeNoteId(noteId);
    if (!cleanNoteId) return null;

    const db = getDrizzleDb();
    const fieldsToSet = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) fieldsToSet.title = (data.title || "").trim().slice(0, 200);
    if (data.content !== undefined) fieldsToSet.content = data.content || "";
    if (data.isPinned !== undefined || data.pinned !== undefined) {
      fieldsToSet.isPinned = Boolean(data.isPinned ?? data.pinned);
    }
    if (data.goal !== undefined || data.goalId !== undefined) {
      const g = data.goal !== undefined ? data.goal : data.goalId;
      fieldsToSet.goalId = g ? normalizeGoalId(g) : null;
    }
    if (data.task !== undefined || data.taskId !== undefined) {
      const t = data.task !== undefined ? data.task : data.taskId;
      fieldsToSet.taskId = t ? normalizeTaskId(t) : null;
    }
    if (data.tags !== undefined) {
      fieldsToSet.tags = Array.isArray(data.tags) ? data.tags.filter(t => typeof t === "string") : [];
    }

    const condition = cleanUserId
      ? and(eq(notes.id, cleanNoteId), eq(notes.userId, cleanUserId))
      : eq(notes.id, cleanNoteId);

    const rows = await db
      .update(notes)
      .set(fieldsToSet)
      .where(condition)
      .returning();
    return toDomainNote(rows[0]);
  }

  async delete(userId, noteId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanNoteId = normalizeNoteId(noteId);
    if (!cleanNoteId) return null;

    const db = getDrizzleDb();
    const condition = cleanUserId
      ? and(eq(notes.id, cleanNoteId), eq(notes.userId, cleanUserId))
      : eq(notes.id, cleanNoteId);

    const rows = await db.delete(notes).where(condition).returning();
    return toDomainNote(rows[0]);
  }
}

export const notesRepository = new NotesRepository();
export default notesRepository;
