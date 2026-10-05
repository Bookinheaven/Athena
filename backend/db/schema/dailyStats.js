import {
  pgTable,
  uuid,
  integer,
  numeric,
  date,
  timestamp,
  pgEnum,
  unique,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

export const dailyStateEnum = pgEnum("daily_state", [
  "green",
  "yellow",
  "red",
  "neutral",
]);

export const dailyResultTypeEnum = pgEnum("daily_result_type", [
  "success",
  "partial",
  "failed",
  "neutral",
  "freeze_saved",
]);

export const dailyStats = pgTable(
  "daily_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productDate: date("product_date").notNull(),

    // Execution Projections
    focusMinutes: integer("focus_minutes").notNull().default(0),
    sessionCount: integer("session_count").notNull().default(0),

    // Planning Projections
    totalPlanned: integer("total_planned").notNull().default(0),
    effectivePlanned: integer("effective_planned").notNull().default(0),
    tasksCompleted: integer("tasks_completed").notNull().default(0),
    tasksPartiallyCompleted: integer("tasks_partially_completed")
      .notNull()
      .default(0),
    tasksRescheduled: integer("tasks_rescheduled").notNull().default(0),
    tasksMissed: integer("tasks_missed").notNull().default(0),
    tasksCancelled: integer("tasks_cancelled").notNull().default(0),

    // Target, Thresholds, & Outcomes
    dailyTargetMinutes: integer("daily_target_minutes").notNull().default(25),
    completionRate: numeric("completion_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0.0000"),
    state: dailyStateEnum("state").notNull().default("neutral"),
    resultType: dailyResultTypeEnum("result_type").notNull().default("neutral"),
    streakCount: integer("streak_count").notNull().default(0),
    usedFreeze: integer("used_freeze").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_daily_stats_user_date").on(table.userId, table.productDate),
    index("idx_daily_stats_user_date").on(table.userId, table.productDate),
    check("chk_daily_freeze", sql`used_freeze IN (0, 1)`),
  ]
);
