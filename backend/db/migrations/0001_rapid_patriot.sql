CREATE TYPE "public"."routine_recurrence_type" AS ENUM('daily', 'selected_days');--> statement-breakpoint
CREATE TYPE "public"."routine_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."routine_occurrence_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped', 'missed');--> statement-breakpoint
CREATE TYPE "public"."routine_step_occurrence_status" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid,
	"title" varchar(150) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "routine_status" DEFAULT 'active' NOT NULL,
	"recurrence_type" "routine_recurrence_type" DEFAULT 'daily' NOT NULL,
	"recurrence_days" integer[] DEFAULT '{1,2,3,4,5,6,7}' NOT NULL,
	"start_product_date" date NOT NULL,
	"estimated_minutes" integer DEFAULT 15 NOT NULL,
	"target_time" varchar(5),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"estimated_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_id" uuid,
	"product_date" date NOT NULL,
	"status" "routine_occurrence_status" DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"total_steps" integer DEFAULT 1 NOT NULL,
	"completed_steps" integer DEFAULT 0 NOT NULL,
	"snapshot_title" varchar(150) NOT NULL,
	"snapshot_goal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_routine_product_date" UNIQUE("user_id","routine_id","product_date")
);
--> statement-breakpoint
CREATE TABLE "routine_step_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"step_id" uuid,
	"title" varchar(150) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "routine_step_occurrence_status" DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_step_occ_order" UNIQUE("occurrence_id","sort_order")
);
--> statement-breakpoint
ALTER TABLE "schedule_blocks" DROP CONSTRAINT "schedule_blocks_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_occurrences" ADD CONSTRAINT "routine_occurrences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_occurrences" ADD CONSTRAINT "routine_occurrences_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_step_occurrences" ADD CONSTRAINT "routine_step_occurrences_occurrence_id_routine_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."routine_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_step_occurrences" ADD CONSTRAINT "routine_step_occurrences_step_id_routine_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."routine_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_routines_user_id" ON "routines" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_routines_user_status" ON "routines" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_routines_goal_id" ON "routines" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "idx_routine_steps_routine_id" ON "routine_steps" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "idx_routine_steps_routine_order" ON "routine_steps" USING btree ("routine_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_routine_occ_user_date" ON "routine_occurrences" USING btree ("user_id","product_date");--> statement-breakpoint
CREATE INDEX "idx_routine_occ_status" ON "routine_occurrences" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_routine_occ_routine_id" ON "routine_occurrences" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "idx_step_occ_occurrence_id" ON "routine_step_occurrences" USING btree ("occurrence_id");--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;