ALTER TABLE "database_credentials" ADD COLUMN "env_file" text NOT NULL;--> statement-breakpoint
ALTER TABLE "database_credentials" DROP COLUMN "algolia_application_id";--> statement-breakpoint
ALTER TABLE "database_credentials" DROP COLUMN "algolia_api_key";--> statement-breakpoint
ALTER TABLE "database_credentials" DROP COLUMN "algolia_index";--> statement-breakpoint
ALTER TABLE "database_credentials" DROP COLUMN "upstash_url";--> statement-breakpoint
ALTER TABLE "database_credentials" DROP COLUMN "upstash_token";--> statement-breakpoint
ALTER TABLE "database_credentials" DROP COLUMN "upstash_index";