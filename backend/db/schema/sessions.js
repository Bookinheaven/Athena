import {
  pgTable,
  uuid,
  varchar,
  integer,
  date,
  timestamp,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { scheduleBlocks } from "./scheduleBlocks.js";

export const sessionTypeEnum = pgEnum("session_type", ["task", "quick"]);
export const sessionStatusEnum = pgEnum("session_status", ["active", "completed"]);
export const sessionCompletionTypeEnum = pgEnum("session_completion_type", [
  "completed",
  "skipped",
  "abandoned",
]);
export const sessionTaskOutcomeEnum = pgEnum("session_task_outcome", [
  "completed",
  "partially_completed",
  "not_completed",
]);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientSessionId: varchar("client_session_id", { length: 64 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scheduleBlockId: uuid("schedule_block_id").references(
      () => scheduleBlocks.id,
      { onDelete: "set null" }
    ),

    title: varchar("title", { length: 200 }).notNull(),
    sessionType: sessionTypeEnum("session_type").notNull().default("quick"),
    status: sessionStatusEnum("status").notNull().default("active"),
    completionType: sessionCompletionTypeEnum("completion_type"),
    sessionTaskOutcome: sessionTaskOutcomeEnum("session_task_outcome"),

    // Execution Timestamps & Checkpointing
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    checkpointRevision: integer("checkpoint_revision").notNull().default(0),

    // Execution Durations (Seconds & Minutes)
    plannedDurationSeconds: integer("planned_duration_seconds")
      .notNull()
      .default(1500),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    totalFocusMinutes: integer("total_focus_minutes").notNull().default(0),
    totalBreakMinutes: integer("total_break_minutes").notNull().default(0),

    // Denormalized Telemetry Counters
    pauseCount: integer("pause_count").notNull().default(0),
    totalPauseDurationSeconds: integer("total_pause_duration_seconds")
      .notNull()
      .default(0),
    focusSegmentsCompleted: integer("focus_segments_completed")
      .notNull()
      .default(0),
    breakSegmentsCompleted: integer("break_segments_completed")
      .notNull()
      .default(0),
    interruptions: integer("interruptions").notNull().default(0),

    // Immutable Historical Snapshot of Linked ScheduleBlock
    snapshotScheduleDate: date("snapshot_schedule_date"),
    snapshotScheduleStartTime: timestamp("snapshot_schedule_start_time", {
      withTimezone: true,
    }),
    snapshotScheduleEndTime: timestamp("snapshot_schedule_end_time", {
      withTimezone: true,
    }),
    snapshotScheduleDurationMinutes: integer(
      "snapshot_schedule_duration_minutes"
    ),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_user_client_session").on(table.userId, table.clientSessionId),
    index("idx_sessions_user_created").on(table.userId, table.createdAt),
    index("idx_sessions_status").on(table.userId, table.status),
    index("idx_sessions_schedule_block").on(table.scheduleBlockId),
  ]
);
