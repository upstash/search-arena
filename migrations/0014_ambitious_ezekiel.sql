ALTER TABLE "search_results" DROP CONSTRAINT "search_results_battle_query_id_database_id_unique";--> statement-breakpoint
ALTER TABLE "databases" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."provider_type";--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('upstash_search', 'algolia');--> statement-breakpoint
ALTER TABLE "databases" ALTER COLUMN "provider" SET DATA TYPE "public"."provider_type" USING "provider"::"public"."provider_type";--> statement-breakpoint
ALTER TABLE "search_results" ADD COLUMN "config_index" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "search_results" ADD CONSTRAINT "search_results_battle_query_id_database_id_config_index_unique" UNIQUE("battle_query_id","database_id","config_index");