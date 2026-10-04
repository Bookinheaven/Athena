import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { sessions } from "./sessions.js";
import { tasks, taskPriorityEnum } from "./tasks.js";

export const sessionTasks = pgTable(
  "session_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),

    // Immutable snapshot preserved if task is altered/deleted
    snapshotTitle: varchar("snapshot_title", { length: 200 }).notNull(),
    snapshotPriority: taskPriorityEnum("snapshot_priority")
      .notNull()
      .default("medium"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_session_task").on(table.sessionId, table.taskId),
    index("idx_session_tasks_session").on(table.sessionId),
    index("idx_session_tasks_task").on(table.taskId),
  ]
);
