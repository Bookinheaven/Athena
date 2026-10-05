import { eq } from "drizzle-orm";
import { getDrizzleDb } from "../db/index.js";
import { streaks } from "../db/schema/streaks.js";
import { normalizeUserId } from "./userRepository.js";

/**
 * Maps PostgreSQL streak row to standard domain object
 */
export function toDomainStreak(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    userId: row.userId,
    currentStreak: row.currentStreak ?? 0,
    longestStreak: row.longestStreak ?? 0,
    lastActiveDate: row.lastActiveDate,
    freezeBalance: row.freezeBalance ?? 3,
    totalFreezesUsed: row.totalFreezesUsed ?? 0,
    maxFreezeBalance: row.maxFreezeBalance ?? 3,
    dailyTargetMinutes: row.dailyTargetMinutes ?? 25,
    minTargetMinutes: row.minTargetMinutes ?? 20,
    maxTargetMinutes: row.maxTargetMinutes ?? 90,
    lastTargetReason: row.lastTargetReason || "no_change",
    lastProcessedDate: row.lastProcessedDate,
    lastCountedDate: row.lastCountedDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class StreakRepository {
  async findByUserId(userId) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return null;
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, cleanUserId))
      .limit(1);
    return toDomainStreak(rows[0]);
  }

  async createForUser(userId, data = {}) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId) return null;
    const db = getDrizzleDb();
    const rows = await db
      .insert(streaks)
      .values({
        userId: cleanUserId,
        currentStreak: data.currentStreak ?? 0,
        longestStreak: data.longestStreak ?? 0,
        lastActiveDate: data.lastActiveDate || null,
        freezeBalance: data.freezeBalance ?? 3,
        totalFreezesUsed: data.totalFreezesUsed ?? 0,
        maxFreezeBalance: data.maxFreezeBalance ?? 3,
        dailyTargetMinutes: data.dailyTargetMinutes ?? 25,
        minTargetMinutes: data.minTargetMinutes ?? 20,
        maxTargetMinutes: data.maxTargetMinutes ?? 90,
        lastTargetReason: data.lastTargetReason || "no_change",
        lastProcessedDate: data.lastProcessedDate || null,
        lastCountedDate: data.lastCountedDate || null,
      })
      .onConflictDoNothing({ target: streaks.userId })
      .returning();

    if (rows.length > 0) {
      return toDomainStreak(rows[0]);
    }
    return this.findByUserId(userId);
  }

  async update(userId, data) {
    const cleanUserId = normalizeUserId(userId);
    if (!cleanUserId || !data) return null;
    const db = getDrizzleDb();
    const fieldsToSet = {
      updatedAt: new Date(),
    };

    if (data.currentStreak !== undefined) fieldsToSet.currentStreak = data.currentStreak;
    if (data.longestStreak !== undefined) fieldsToSet.longestStreak = data.longestStreak;
    if (data.lastActiveDate !== undefined) fieldsToSet.lastActiveDate = data.lastActiveDate;
    if (data.freezeBalance !== undefined) fieldsToSet.freezeBalance = data.freezeBalance;
    if (data.totalFreezesUsed !== undefined) fieldsToSet.totalFreezesUsed = data.totalFreezesUsed;
    if (data.maxFreezeBalance !== undefined) fieldsToSet.maxFreezeBalance = data.maxFreezeBalance;
    if (data.dailyTargetMinutes !== undefined) fieldsToSet.dailyTargetMinutes = data.dailyTargetMinutes;
    if (data.minTargetMinutes !== undefined) fieldsToSet.minTargetMinutes = data.minTargetMinutes;
    if (data.maxTargetMinutes !== undefined) fieldsToSet.maxTargetMinutes = data.maxTargetMinutes;
    if (data.lastTargetReason !== undefined) fieldsToSet.lastTargetReason = data.lastTargetReason;
    if (data.lastProcessedDate !== undefined) fieldsToSet.lastProcessedDate = data.lastProcessedDate;
    if (data.lastCountedDate !== undefined) fieldsToSet.lastCountedDate = data.lastCountedDate;

    const rows = await db
      .update(streaks)
      .set(fieldsToSet)
      .where(eq(streaks.userId, cleanUserId))
      .returning();
    return toDomainStreak(rows[0]);
  }
}

export const streakRepository = new StreakRepository();
export default streakRepository;
