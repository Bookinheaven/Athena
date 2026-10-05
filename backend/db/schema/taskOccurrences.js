import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { tasks, taskPriorityEnum } from "./tasks.js";

export const occurrenceOutcomeEnum = pgEnum("occurrence_outcome", [
  "pending",
  "completed",
  "partially_completed",
  "rescheduled",
  "missed",
  "cancelled",
]);

export const taskOccurrences = pgTable(
  "task_occurrences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    productDate: date("product_date").notNull(),
    outcome: occurrenceOutcomeEnum("outcome").notNull().default("pending"),
    rescheduledToDate: date("rescheduled_to_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes").notNull().default(""),

    // Immutable Historical Snapshot of Task Metadata
    snapshotTitle: varchar("snapshot_title", { length: 200 }).notNull(),
    snapshotPriority: taskPriorityEnum("snapshot_priority")
      .notNull()
      .default("medium"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_user_task_product_date").on(
      table.userId,
      table.taskId,
      table.productDate
    ),
    index("idx_occurrences_user_date").on(table.userId, table.productDate),
    index("idx_occurrences_outcome").on(table.userId, table.outcome),
    index("idx_occurrences_task_id").on(table.taskId),
  ]
);
