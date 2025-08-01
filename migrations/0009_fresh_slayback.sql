ALTER TABLE "battles" ADD COLUMN "is_demo" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX "is_demo_idx" ON "battles" USING btree ("is_demo");