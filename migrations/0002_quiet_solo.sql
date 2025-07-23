DROP TABLE "database_credentials" CASCADE;--> statement-breakpoint
ALTER TABLE "databases" ADD COLUMN "credentials" text NOT NULL;