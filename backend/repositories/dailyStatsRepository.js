import { eq, and, sql, desc, asc, lte, gte } from "drizzle-orm";
import { getDrizzleDb } from "../db/index.js";
import { dailyStats } from "../db/schema/dailyStats.js";
import { normalizeUserId } from "./userRepository.js";

/**
 * Maps PostgreSQL daily_stats row to domain object
 */
export function toDomainDailyStats(row) {
  if (!row) return null;
  const pDate = row.productDate instanceof Date
    ? row.productDate.toISOString().slice(0, 10)
    : String(row.productDate).slice(0, 10);

  return {
    id: row.id,
    _id: row.id,
    userId: row.userId,
    productDate: pDate,
    date: pDate,
    focusMinutes: row.focusMinutes ?? 0,
    sessions: row.sessionCount ?? 0,
    sessionCount: row.sessionCount ?? 0,
    totalPlanned: row.totalPlanned ?? 0,
    effectivePlanned: row.effectivePlanned ?? 0,
    tasksCompleted: row.tasksCompleted ?? 0,
    tasksPartiallyCompleted: row.tasksPartiallyCompleted ?? 0,
    tasksRescheduled: row.tasksRescheduled ?? 0,
    tasksMissed: row.tasksMissed ?? 0,
    tasksCancelled: row.tasksCancelled ?? 0,
    dailyTargetMinutes: row.dailyTargetMinutes ?? 25,
    completionRate: Number(row.completionRate ?? 0),
    streakRate: Number(row.completionRate ?? 0),
    state: row.state || "neutral",
    resultType: row.resultType || "neutral",
    streakCount: row.streakCount ?? 0,
    usedFreeze: row.usedFreeze ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class DailyStatsRepository {
  async findByUserAndDate(userId, productDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !productDate) return null;
    const cleanDate = typeof productDate === "string" ? productDate.slice(0, 10) : productDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(dailyStats)
      .where(and(eq(dailyStats.userId, cleanUserId), eq(dailyStats.productDate, cleanDate)))
      .limit(1);
    return toDomainDailyStats(rows[0]);
  }

  async findByUserAndDateRange(userId, startDate, endDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];
    const db = getDrizzleDb();
    const conditions = [eq(dailyStats.userId, cleanUserId)];

    if (startDate) {
      const s = typeof startDate === "string" ? startDate.slice(0, 10) : startDate.toISOString().slice(0, 10);
      conditions.push(gte(dailyStats.productDate, s));
    }
    if (endDate) {
      const e = typeof endDate === "string" ? endDate.slice(0, 10) : endDate.toISOString().slice(0, 10);
      conditions.push(lte(dailyStats.productDate, e));
    }

    const rows = await db
      .select()
      .from(dailyStats)
      .where(and(...conditions))
      .orderBy(asc(dailyStats.productDate));

    return rows.map(toDomainDailyStats);
  }

  async getRecentDays(userId, limit = 7) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return [];
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.userId, cleanUserId))
      .orderBy(desc(dailyStats.productDate))
      .limit(limit);
    return rows.map(toDomainDailyStats);
  }

  async upsert(userId, productDate, data = {}) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !productDate) return null;
    const cleanDate = typeof productDate === "string" ? productDate.slice(0, 10) : productDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();

    const insertValues = {
      userId: cleanUserId,
      productDate: cleanDate,
      focusMinutes: data.focusMinutes ?? 0,
      sessionCount: data.sessionCount ?? data.sessions ?? 0,
      totalPlanned: data.totalPlanned ?? 0,
      effectivePlanned: data.effectivePlanned ?? 0,
      tasksCompleted: data.tasksCompleted ?? 0,
      tasksPartiallyCompleted: data.tasksPartiallyCompleted ?? 0,
      tasksRescheduled: data.tasksRescheduled ?? 0,
      tasksMissed: data.tasksMissed ?? 0,
      tasksCancelled: data.tasksCancelled ?? 0,
      dailyTargetMinutes: data.dailyTargetMinutes ?? 25,
      completionRate: (data.completionRate ?? data.streakRate ?? 0).toFixed(4),
      state: data.state || "neutral",
      resultType: data.resultType || "neutral",
      streakCount: data.streakCount ?? 0,
      usedFreeze: data.usedFreeze ?? 0,
    };

    const updateSet = {
      updatedAt: new Date(),
    };

    if (data.focusMinutes !== undefined) updateSet.focusMinutes = data.focusMinutes;
    if (data.sessionCount !== undefined || data.sessions !== undefined) {
      updateSet.sessionCount = data.sessionCount ?? data.sessions;
    }
    if (data.totalPlanned !== undefined) updateSet.totalPlanned = data.totalPlanned;
    if (data.effectivePlanned !== undefined) updateSet.effectivePlanned = data.effectivePlanned;
    if (data.tasksCompleted !== undefined) updateSet.tasksCompleted = data.tasksCompleted;
    if (data.tasksPartiallyCompleted !== undefined) updateSet.tasksPartiallyCompleted = data.tasksPartiallyCompleted;
    if (data.tasksRescheduled !== undefined) updateSet.tasksRescheduled = data.tasksRescheduled;
    if (data.tasksMissed !== undefined) updateSet.tasksMissed = data.tasksMissed;
    if (data.tasksCancelled !== undefined) updateSet.tasksCancelled = data.tasksCancelled;
    if (data.dailyTargetMinutes !== undefined) updateSet.dailyTargetMinutes = data.dailyTargetMinutes;
    if (data.completionRate !== undefined || data.streakRate !== undefined) {
      updateSet.completionRate = (data.completionRate ?? data.streakRate).toFixed(4);
    }
    if (data.state !== undefined) updateSet.state = data.state;
    if (data.resultType !== undefined) updateSet.resultType = data.resultType;
    if (data.streakCount !== undefined) updateSet.streakCount = data.streakCount;
    if (data.usedFreeze !== undefined) updateSet.usedFreeze = data.usedFreeze;

    const rows = await db
      .insert(dailyStats)
      .values(insertValues)
      .onConflictDoUpdate({
        target: [dailyStats.userId, dailyStats.productDate],
        set: updateSet,
      })
      .returning();

    return toDomainDailyStats(rows[0]);
  }

  async incrementFocus(userId, productDate, sessionMinutes) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !productDate) return null;
    const cleanDate = typeof productDate === "string" ? productDate.slice(0, 10) : productDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();
    const minutes = Math.round(Number(sessionMinutes) || 0);

    const rows = await db
      .insert(dailyStats)
      .values({
        userId: cleanUserId,
        productDate: cleanDate,
        focusMinutes: minutes,
        sessionCount: 1,
        dailyTargetMinutes: 25,
        completionRate: "0.0000",
        state: "neutral",
        resultType: "neutral",
        streakCount: 0,
        usedFreeze: 0,
      })
      .onConflictDoUpdate({
        target: [dailyStats.userId, dailyStats.productDate],
        set: {
          focusMinutes: sql`${dailyStats.focusMinutes} + ${minutes}`,
          sessionCount: sql`${dailyStats.sessionCount} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning();

    return toDomainDailyStats(rows[0]);
  }

  async findPastStats(userId, beforeProductDate) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !beforeProductDate) return [];
    const cleanDate = typeof beforeProductDate === "string" ? beforeProductDate.slice(0, 10) : beforeProductDate.toISOString().slice(0, 10);
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(dailyStats)
      .where(
        and(
          eq(dailyStats.userId, cleanUserId),
          sql`${dailyStats.productDate} < ${cleanDate}::date`
        )
      )
      .orderBy(asc(dailyStats.productDate));
    return rows.map(toDomainDailyStats);
  }
}

export const dailyStatsRepository = new DailyStatsRepository();
export default dailyStatsRepository;
