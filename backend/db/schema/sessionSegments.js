import {
  pgTable,
  uuid,
  integer,
  timestamp,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { sessions } from "./sessions.js";

export const segmentTypeEnum = pgEnum("segment_type", ["focus", "break"]);

export const sessionSegments = pgTable(
  "session_segments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    segmentIndex: integer("segment_index").notNull(),
    type: segmentTypeEnum("type").notNull(),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    totalDurationSeconds: integer("total_duration_seconds").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_session_segment_index").on(table.sessionId, table.segmentIndex),
    index("idx_session_segments_session").on(table.sessionId),
  ]
);
