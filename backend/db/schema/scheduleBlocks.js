import {
  pgTable,
  uuid,
  integer,
  date,
  timestamp,
  pgEnum,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { tasks } from "./tasks.js";
import { sessions } from "./sessions.js";

export const scheduleBlockStatusEnum = pgEnum("schedule_block_status", [
  "scheduled",
  "completed",
  "skipped",
]);

export const scheduleBlocks = pgTable(
  "schedule_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    productDate: date("product_date").notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    status: scheduleBlockStatusEnum("status").notNull().default("scheduled"),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_schedule_blocks_user_date").on(table.userId, table.productDate),
    index("idx_schedule_blocks_task").on(table.taskId),
    check("chk_block_duration_min", sql`duration_minutes >= 1`),
    check("chk_block_time_order", sql`end_time > start_time`),
  ]
);
