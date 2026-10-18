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

export const routineStatusEnum = pgEnum("routine_status", [
  "active",
  "paused",
  "archived",
]);

export const routineRecurrenceTypeEnum = pgEnum("routine_recurrence_type", [
  "daily",
  "selected_days",
]);

export const routines = pgTable("routines", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  goalId: uuid("goal_id").references(() => goals.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description").notNull().default(""),
  status: routineStatusEnum("status").notNull().default("active"),
  recurrenceType: routineRecurrenceTypeEnum("recurrence_type")
    .notNull()
    .default("daily"),
  recurrenceDays: integer("recurrence_days")
    .array()
    .notNull()
    .default(sql`'{1,2,3,4,5,6,7}'`),
  startProductDate: date("start_product_date").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  targetTime: varchar("target_time", { length: 5 }), // Optional "HH:MM"
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
},
  (table) => [
    index("idx_routines_user_id").on(table.userId),
    index("idx_routines_user_status").on(table.userId, table.status),
    index("idx_routines_goal_id").on(table.goalId),
  ]
);
