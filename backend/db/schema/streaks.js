import {
  pgTable,
  uuid,
  integer,
  date,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const streakTargetReasonEnum = pgEnum("streak_target_reason", [
  "increase_consistency",
  "decrease_burnout",
  "no_change",
]);

export const streaks = pgTable(
  "streaks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastActiveDate: date("last_active_date"),
    freezeBalance: integer("freeze_balance").notNull().default(3),
    totalFreezesUsed: integer("total_freezes_used").notNull().default(0),
    maxFreezeBalance: integer("max_freeze_balance").notNull().default(3),

    dailyTargetMinutes: integer("daily_target_minutes").notNull().default(25),
    minTargetMinutes: integer("min_target_minutes").notNull().default(20),
    maxTargetMinutes: integer("max_target_minutes").notNull().default(90),
    lastTargetReason: streakTargetReasonEnum("last_target_reason")
      .notNull()
      .default("no_change"),

    lastProcessedDate: date("last_processed_date"),
    lastCountedDate: date("last_counted_date"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_streaks_user").on(table.userId)]
);
