import { eq, and, asc, desc, lte, gte } from "drizzle-orm";
import { getDrizzleDb } from "../db/index.js";
import { scheduleBlocks } from "../db/schema/scheduleBlocks.js";
import { normalizeUserId } from "./userRepository.js";
import { normalizeTaskId } from "./taskRepository.js";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeBlockId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

export function toDomainScheduleBlock(row) {
  if (!row) return null;
  const pDate = row.productDate instanceof Date
    ? row.productDate.toISOString().slice(0, 10)
    : String(row.productDate).slice(0, 10);

  return {
    id: row.id,
    _id: row.id,
    userId: row.userId,
    user: row.userId,
    taskId: row.taskId,
    task: row.taskId,
    date: pDate ? new Date(`${pDate}T00:00:00.000Z`) : null,
    productDate: pDate,
    startTime: row.startTime,
    endTime: row.endTime,
    durationMinutes: row.durationMinutes,
    status: row.status || "scheduled",
    sessionId: row.sessionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class ScheduleBlockRepository {
  async findById(blockId) {
    const cleanId = normalizeBlockId(blockId);
    if (!cleanId) return null;
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(scheduleBlocks)
      .where(eq(scheduleBlocks.id, cleanId))
      .limit(1);
    return toDomainScheduleBlock(rows[0]);
  }

  async findByUserAndDate(userId, productDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !productDate) return [];
    const cleanDate = typeof productDate === "string" ? productDate.slice(0, 10) : productDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(scheduleBlocks)
      .where(
        and(
          eq(scheduleBlocks.userId, cleanUserId),
          eq(scheduleBlocks.productDate, cleanDate)
        )
      )
      .orderBy(asc(scheduleBlocks.startTime));
    return rows.map(toDomainScheduleBlock);
  }

  async findByUserAndDateRange(userId, startDate, endDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];
    const db = getDrizzleDb();
    const conditions = [eq(scheduleBlocks.userId, cleanUserId)];

    if (startDate) {
      const s = typeof startDate === "string" ? startDate.slice(0, 10) : startDate.toISOString().slice(0, 10);
      conditions.push(gte(scheduleBlocks.productDate, s));
    }
    if (endDate) {
      const e = typeof endDate === "string" ? endDate.slice(0, 10) : endDate.toISOString().slice(0, 10);
      conditions.push(lte(scheduleBlocks.productDate, e));
    }

    const rows = await db
      .select()
      .from(scheduleBlocks)
      .where(and(...conditions))
      .orderBy(asc(scheduleBlocks.startTime));
    return rows.map(toDomainScheduleBlock);
  }

  async findByTaskId(taskId) {
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanTaskId) return [];
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(scheduleBlocks)
      .where(eq(scheduleBlocks.taskId, cleanTaskId))
      .orderBy(desc(scheduleBlocks.startTime));
    return rows.map(toDomainScheduleBlock);
  }

  async create(userId, data) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(data.taskId || data.task);
    if (!cleanUserId || !cleanTaskId) {
      throw new Error("Valid userId and taskId required for ScheduleBlock");
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const durationMinutes = Number(data.durationMinutes) || Math.max(1, Math.round((endTime - startTime) / 60000));
    const pDate = data.productDate || (data.date ? String(data.date).slice(0, 10) : startTime.toISOString().slice(0, 10));

    const db = getDrizzleDb();
    const rows = await db
      .insert(scheduleBlocks)
      .values({
        userId: cleanUserId,
        taskId: cleanTaskId,
        productDate: pDate,
        startTime,
        endTime,
        durationMinutes: Math.max(1, durationMinutes),
        status: ["scheduled", "completed", "skipped"].includes(data.status) ? data.status : "scheduled",
        sessionId: data.sessionId || null,
      })
      .returning();
    return toDomainScheduleBlock(rows[0]);
  }

  async update(userId, blockId, data) {
    const cleanUserId = normalizeUserId(userId);
    const cleanBlockId = normalizeBlockId(blockId);
    if (!cleanBlockId) return null;

    const db = getDrizzleDb();
    const fieldsToSet = {
      updatedAt: new Date(),
    };

    if (data.taskId !== undefined || data.task !== undefined) {
      fieldsToSet.taskId = normalizeTaskId(data.taskId || data.task);
    }
    if (data.startTime !== undefined) fieldsToSet.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) fieldsToSet.endTime = new Date(data.endTime);
    if (data.durationMinutes !== undefined) {
      fieldsToSet.durationMinutes = Math.max(1, Number(data.durationMinutes));
    }
    if (data.status !== undefined && ["scheduled", "completed", "skipped"].includes(data.status)) {
      fieldsToSet.status = data.status;
    }
    if (data.productDate !== undefined || data.date !== undefined) {
      const p = data.productDate || data.date;
      fieldsToSet.productDate = String(p).slice(0, 10);
    }
    if (data.sessionId !== undefined) {
      fieldsToSet.sessionId = data.sessionId;
    }

    const condition = cleanUserId
      ? and(eq(scheduleBlocks.id, cleanBlockId), eq(scheduleBlocks.userId, cleanUserId))
      : eq(scheduleBlocks.id, cleanBlockId);

    const rows = await db
      .update(scheduleBlocks)
      .set(fieldsToSet)
      .where(condition)
      .returning();
    return toDomainScheduleBlock(rows[0]);
  }

  async delete(userId, blockId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanBlockId = normalizeBlockId(blockId);
    if (!cleanBlockId) return null;

    const db = getDrizzleDb();
    const condition = cleanUserId
      ? and(eq(scheduleBlocks.id, cleanBlockId), eq(scheduleBlocks.userId, cleanUserId))
      : eq(scheduleBlocks.id, cleanBlockId);

    const rows = await db.delete(scheduleBlocks).where(condition).returning();
    return toDomainScheduleBlock(rows[0]);
  }

  async deleteByTaskId(userId, taskId) {
    const cleanUserId = normalizeUserId(userId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanTaskId) return 0;

    const db = getDrizzleDb();
    const condition = cleanUserId
      ? and(eq(scheduleBlocks.taskId, cleanTaskId), eq(scheduleBlocks.userId, cleanUserId))
      : eq(scheduleBlocks.taskId, cleanTaskId);

    const rows = await db.delete(scheduleBlocks).where(condition).returning();
    return rows.length;
  }
}

export const scheduleBlockRepository = new ScheduleBlockRepository();
export default scheduleBlockRepository;
