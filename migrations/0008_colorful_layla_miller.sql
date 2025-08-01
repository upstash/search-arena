ALTER TABLE "battles" ADD COLUMN "session_id" varchar(255);--> statement-breakpoint
CREATE INDEX "session_id_idx" ON "battles" USING btree ("session_id");