import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  date,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { goals } from "./goals.js";

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in-progress",
  "completed",
  "cancelled",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id").references(() => goals.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull().default(""),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    orderIndex: integer("order_index").notNull().default(0),
    dueDate: date("due_date"),
    plannedProductDate: date("planned_product_date"),
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
    index("idx_tasks_user_id").on(table.userId),
    index("idx_tasks_user_status").on(table.userId, table.status),
    index("idx_tasks_planned_date").on(table.userId, table.plannedProductDate),
    index("idx_tasks_goal_id").on(table.goalId),
  ]
);
