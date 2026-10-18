ALTER TABLE "schedule_blocks" ALTER COLUMN "task_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD COLUMN "routine_occurrence_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "routine_occurrence_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "routine_step_occurrence_id" uuid;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_routine_occurrence_id_routine_occurrences_id_fk" FOREIGN KEY ("routine_occurrence_id") REFERENCES "public"."routine_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_routine_occurrence_id_routine_occurrences_id_fk" FOREIGN KEY ("routine_occurrence_id") REFERENCES "public"."routine_occurrences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_routine_step_occurrence_id_routine_step_occurrences_id_fk" FOREIGN KEY ("routine_step_occurrence_id") REFERENCES "public"."routine_step_occurrences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_schedule_blocks_routine_occ" ON "schedule_blocks" USING btree ("routine_occurrence_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_schedule_blocks_user_routine_occ" ON "schedule_blocks" USING btree ("user_id","routine_occurrence_id") WHERE routine_occurrence_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_sessions_routine_occ" ON "sessions" USING btree ("routine_occurrence_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_routine_step_occ" ON "sessions" USING btree ("routine_step_occurrence_id");--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "chk_schedule_blocks_single_target" CHECK ((task_id IS NOT NULL AND routine_occurrence_id IS NULL) OR (task_id IS NULL AND routine_occurrence_id IS NOT NULL));