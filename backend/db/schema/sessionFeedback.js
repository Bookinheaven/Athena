import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { sessions } from "./sessions.js";

export const sessionFeedback = pgTable(
  "session_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .unique()
      .references(() => sessions.id, { onDelete: "cascade" }),
    moodRating: integer("mood_rating"),
    focusRating: integer("focus_rating"),
    distractionsNotes: text("distractions_notes").notNull().default(""),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_session_feedback_session").on(table.sessionId),
    check("chk_mood_rating", sql`mood_rating >= 1 AND mood_rating <= 5`),
    check("chk_focus_rating", sql`focus_rating >= 1 AND focus_rating <= 5`),
  ]
);
