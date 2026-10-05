CREATE TYPE "public"."goal_status" AS ENUM('active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in-progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."occurrence_outcome" AS ENUM('pending', 'completed', 'partially_completed', 'rescheduled', 'missed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."schedule_block_status" AS ENUM('scheduled', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."session_completion_type" AS ENUM('completed', 'skipped', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."session_task_outcome" AS ENUM('completed', 'partially_completed', 'not_completed');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('task', 'quick');--> statement-breakpoint
CREATE TYPE "public"."segment_type" AS ENUM('focus', 'break');--> statement-breakpoint
CREATE TYPE "public"."daily_result_type" AS ENUM('success', 'partial', 'failed', 'neutral', 'freeze_saved');--> statement-breakpoint
CREATE TYPE "public"."daily_state" AS ENUM('green', 'yellow', 'red', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."streak_target_reason" AS ENUM('increase_consistency', 'decrease_burnout', 'no_change');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(20) NOT NULL,
	"username_lower" varchar(20) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"account_type" varchar(20) DEFAULT 'user' NOT NULL,
	"full_name" varchar(50) NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"theme" varchar(20) DEFAULT 'dark' NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"break_duration_seconds" integer DEFAULT 300 NOT NULL,
	"auto_start_breaks" boolean DEFAULT true NOT NULL,
	"breaks_number" integer DEFAULT 4 NOT NULL,
	"sound_enabled" boolean DEFAULT false NOT NULL,
	"skip_breaks" boolean DEFAULT true NOT NULL,
	"confirm_reset" boolean DEFAULT true NOT NULL,
	"sound_on_transition" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_username_lower_unique" UNIQUE("username_lower"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"progress" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"color" varchar(7) DEFAULT '#6366f1' NOT NULL,
	"start_date" date,
	"due_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_goals_progress" CHECK (progress >= 0.00 AND progress <= 100.00)
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"due_date" date,
	"planned_product_date" date,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"product_date" date NOT NULL,
	"outcome" "occurrence_outcome" DEFAULT 'pending' NOT NULL,
	"rescheduled_to_date" date,
	"completed_at" timestamp with time zone,
	"notes" text DEFAULT '' NOT NULL,
	"snapshot_title" varchar(200) NOT NULL,
	"snapshot_priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_task_product_date" UNIQUE("user_id","task_id","product_date")
);
--> statement-breakpoint
CREATE TABLE "schedule_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"product_date" date NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"status" "schedule_block_status" DEFAULT 'scheduled' NOT NULL,
	"session_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_block_duration_min" CHECK (duration_minutes >= 1),
	CONSTRAINT "chk_block_time_order" CHECK (end_time > start_time)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_session_id" varchar(64) NOT NULL,
	"user_id" uuid NOT NULL,
	"schedule_block_id" uuid,
	"title" varchar(200) NOT NULL,
	"session_type" "session_type" DEFAULT 'quick' NOT NULL,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"completion_type" "session_completion_type",
	"session_task_outcome" "session_task_outcome",
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"checkpoint_revision" integer DEFAULT 0 NOT NULL,
	"planned_duration_seconds" integer DEFAULT 1500 NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"total_focus_minutes" integer DEFAULT 0 NOT NULL,
	"total_break_minutes" integer DEFAULT 0 NOT NULL,
	"pause_count" integer DEFAULT 0 NOT NULL,
	"total_pause_duration_seconds" integer DEFAULT 0 NOT NULL,
	"focus_segments_completed" integer DEFAULT 0 NOT NULL,
	"break_segments_completed" integer DEFAULT 0 NOT NULL,
	"interruptions" integer DEFAULT 0 NOT NULL,
	"snapshot_schedule_date" date,
	"snapshot_schedule_start_time" timestamp with time zone,
	"snapshot_schedule_end_time" timestamp with time zone,
	"snapshot_schedule_duration_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_client_session" UNIQUE("user_id","client_session_id")
);
--> statement-breakpoint
CREATE TABLE "session_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"snapshot_title" varchar(200) NOT NULL,
	"snapshot_priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_session_task" UNIQUE("session_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "session_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"segment_index" integer NOT NULL,
	"type" "segment_type" NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"total_duration_seconds" integer NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_session_segment_index" UNIQUE("session_id","segment_index")
);
--> statement-breakpoint
CREATE TABLE "session_pause_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"client_pause_id" varchar(64) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"reason" varchar(100) DEFAULT 'Manual Pause' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_session_pause_client_id" UNIQUE("session_id","client_pause_id")
);
--> statement-breakpoint
CREATE TABLE "session_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"mood_rating" integer,
	"focus_rating" integer,
	"distractions_notes" text DEFAULT '' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_feedback_session_id_unique" UNIQUE("session_id"),
	CONSTRAINT "chk_mood_rating" CHECK (mood_rating >= 1 AND mood_rating <= 5),
	CONSTRAINT "chk_focus_rating" CHECK (focus_rating >= 1 AND focus_rating <= 5)
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid,
	"task_id" uuid,
	"title" varchar(200) DEFAULT '' NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_date" date NOT NULL,
	"focus_minutes" integer DEFAULT 0 NOT NULL,
	"session_count" integer DEFAULT 0 NOT NULL,
	"total_planned" integer DEFAULT 0 NOT NULL,
	"effective_planned" integer DEFAULT 0 NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"tasks_partially_completed" integer DEFAULT 0 NOT NULL,
	"tasks_rescheduled" integer DEFAULT 0 NOT NULL,
	"tasks_missed" integer DEFAULT 0 NOT NULL,
	"tasks_cancelled" integer DEFAULT 0 NOT NULL,
	"daily_target_minutes" integer DEFAULT 25 NOT NULL,
	"completion_rate" numeric(5, 4) DEFAULT '0.0000' NOT NULL,
	"state" "daily_state" DEFAULT 'neutral' NOT NULL,
	"result_type" "daily_result_type" DEFAULT 'neutral' NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"used_freeze" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_daily_stats_user_date" UNIQUE("user_id","product_date"),
	CONSTRAINT "chk_daily_freeze" CHECK (used_freeze IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_active_date" date,
	"freeze_balance" integer DEFAULT 3 NOT NULL,
	"total_freezes_used" integer DEFAULT 0 NOT NULL,
	"max_freeze_balance" integer DEFAULT 3 NOT NULL,
	"daily_target_minutes" integer DEFAULT 25 NOT NULL,
	"min_target_minutes" integer DEFAULT 20 NOT NULL,
	"max_target_minutes" integer DEFAULT 90 NOT NULL,
	"last_target_reason" "streak_target_reason" DEFAULT 'no_change' NOT NULL,
	"last_processed_date" date,
	"last_counted_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_occurrences" ADD CONSTRAINT "task_occurrences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_occurrences" ADD CONSTRAINT "task_occurrences_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_schedule_block_id_schedule_blocks_id_fk" FOREIGN KEY ("schedule_block_id") REFERENCES "public"."schedule_blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_tasks" ADD CONSTRAINT "session_tasks_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_tasks" ADD CONSTRAINT "session_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_segments" ADD CONSTRAINT "session_segments_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_pause_events" ADD CONSTRAINT "session_pause_events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_username_lower" ON "users" USING btree ("username_lower");--> statement-breakpoint
CREATE INDEX "idx_goals_user_id" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_goals_status" ON "goals" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_tasks_user_id" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_user_status" ON "tasks" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_tasks_planned_date" ON "tasks" USING btree ("user_id","planned_product_date");--> statement-breakpoint
CREATE INDEX "idx_tasks_goal_id" ON "tasks" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "idx_occurrences_user_date" ON "task_occurrences" USING btree ("user_id","product_date");--> statement-breakpoint
CREATE INDEX "idx_occurrences_outcome" ON "task_occurrences" USING btree ("user_id","outcome");--> statement-breakpoint
CREATE INDEX "idx_occurrences_task_id" ON "task_occurrences" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_schedule_blocks_user_date" ON "schedule_blocks" USING btree ("user_id","product_date");--> statement-breakpoint
CREATE INDEX "idx_schedule_blocks_task" ON "schedule_blocks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_created" ON "sessions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_status" ON "sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_sessions_schedule_block" ON "sessions" USING btree ("schedule_block_id");--> statement-breakpoint
CREATE INDEX "idx_session_tasks_session" ON "session_tasks" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_session_tasks_task" ON "session_tasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_session_segments_session" ON "session_segments" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_session_pauses_session" ON "session_pause_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_session_feedback_session" ON "session_feedback" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_notes_user_id" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notes_task_id" ON "notes" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_notes_goal_id" ON "notes" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "idx_daily_stats_user_date" ON "daily_stats" USING btree ("user_id","product_date");--> statement-breakpoint
CREATE INDEX "idx_streaks_user" ON "streaks" USING btree ("user_id");