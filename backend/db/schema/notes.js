import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { goals } from "./goals.js";
import { tasks } from "./tasks.js";

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id").references(() => goals.id, {
      onDelete: "set null",
    }),
    taskId: uuid("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 200 }).notNull().default(""),
    content: text("content").notNull(),
    isPinned: boolean("is_pinned").notNull().default(false),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_notes_user_id").on(table.userId),
    index("idx_notes_task_id").on(table.taskId),
    index("idx_notes_goal_id").on(table.goalId),
  ]
);
