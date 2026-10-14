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
import { routines } from "./routines.js";

export const routineOccurrenceStatusEnum = pgEnum(
  "routine_occurrence_status",
  ["pending", "in_progress", "completed", "skipped", "missed"]
);

export const routineOccurrences = pgTable(
  "routine_occurrences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    routineId: uuid("routine_id").references(() => routines.id, {
      onDelete: "set null",
    }),
    productDate: date("product_date").notNull(),
    status: routineOccurrenceStatusEnum("status").notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    totalSteps: integer("total_steps").notNull().default(1),
    completedSteps: integer("completed_steps").notNull().default(0),
    snapshotTitle: varchar("snapshot_title", { length: 150 }).notNull(),
    snapshotGoalId: uuid("snapshot_goal_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_user_routine_product_date").on(
      table.userId,
      table.routineId,
      table.productDate
    ),
    index("idx_routine_occ_user_date").on(table.userId, table.productDate),
    index("idx_routine_occ_status").on(table.userId, table.status),
    index("idx_routine_occ_routine_id").on(table.routineId),
  ]
);
