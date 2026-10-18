import {
  pgTable,
  uuid,
  integer,
  date,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { tasks } from "./tasks.js";
import { sessions } from "./sessions.js";
import { routineOccurrences } from "./routineOccurrences.js";

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
      .references(() => tasks.id, { onDelete: "cascade" }),
    routineOccurrenceId: uuid("routine_occurrence_id").references(
      () => routineOccurrences.id,
      { onDelete: "cascade" }
    ),
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
    index("idx_schedule_blocks_routine_occ").on(table.routineOccurrenceId),
    uniqueIndex("idx_schedule_blocks_user_routine_occ")
      .on(table.userId, table.routineOccurrenceId)
      .where(sql`routine_occurrence_id IS NOT NULL`),
    check("chk_block_duration_min", sql`duration_minutes >= 1`),
    check("chk_block_time_order", sql`end_time > start_time`),
    check(
      "chk_schedule_blocks_single_target",
      sql`(task_id IS NOT NULL AND routine_occurrence_id IS NULL) OR (task_id IS NULL AND routine_occurrence_id IS NOT NULL)`
    ),
  ]
);
