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

export const sessionPauseEvents = pgTable(
  "session_pause_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    clientPauseId: varchar("client_pause_id", { length: 64 }).notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    reason: varchar("reason", { length: 100 }).notNull().default("Manual Pause"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_session_pause_client_id").on(
      table.sessionId,
      table.clientPauseId
    ),
    index("idx_session_pauses_session").on(table.sessionId),
  ]
);
