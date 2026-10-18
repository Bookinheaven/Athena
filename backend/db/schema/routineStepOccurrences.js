import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { routineOccurrences } from "./routineOccurrences.js";
import { routineSteps } from "./routineSteps.js";

export const routineStepOccurrenceStatusEnum = pgEnum(
  "routine_step_occurrence_status",
  ["pending", "completed"]
);

export const routineStepOccurrences = pgTable(
  "routine_step_occurrences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    occurrenceId: uuid("occurrence_id")
      .notNull()
      .references(() => routineOccurrences.id, { onDelete: "cascade" }),
    stepId: uuid("step_id").references(() => routineSteps.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 150 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    status: routineStepOccurrenceStatusEnum("status")
      .notNull()
      .default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_step_occ_order").on(table.occurrenceId, table.sortOrder),
    index("idx_step_occ_occurrence_id").on(table.occurrenceId),
  ]
);
