import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 20 }).notNull().unique(),
    usernameLower: varchar("username_lower", { length: 20 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    accountType: varchar("account_type", { length: 20 }).notNull().default("user"),
    fullName: varchar("full_name", { length: 50 }).notNull(),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

    // Preferences & Temporal Settings
    theme: varchar("theme", { length: 20 }).notNull().default("dark"),
    timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),

    // Focus Session Preferences
    breakDurationSeconds: integer("break_duration_seconds").notNull().default(300),
    autoStartBreaks: boolean("auto_start_breaks").notNull().default(true),
    breaksNumber: integer("breaks_number").notNull().default(4),
    soundEnabled: boolean("sound_enabled").notNull().default(false),
    skipBreaks: boolean("skip_breaks").notNull().default(true),
    confirmReset: boolean("confirm_reset").notNull().default(true),
    soundOnTransition: boolean("sound_on_transition").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_username_lower").on(table.usernameLower),
  ]
);
