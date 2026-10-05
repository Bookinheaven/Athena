import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  date,
  timestamp,
  pgEnum,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "archived",
]);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description").notNull().default(""),
    status: goalStatusEnum("status").notNull().default("active"),
    progress: numeric("progress", { precision: 5, scale: 2 })
      .notNull()
      .default("0.00"),
    color: varchar("color", { length: 7 }).notNull().default("#6366f1"),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_goals_user_id").on(table.userId),
    index("idx_goals_status").on(table.userId, table.status),
    check("chk_goals_progress", sql`progress >= 0.00 AND progress <= 100.00`),
  ]
);
