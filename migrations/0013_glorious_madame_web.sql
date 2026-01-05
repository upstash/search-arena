ALTER TABLE "battles" ADD COLUMN "config1" text;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "config2" text;--> statement-breakpoint
ALTER TABLE "databases" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;