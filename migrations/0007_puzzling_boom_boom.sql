ALTER TABLE "search_results" ADD COLUMN "search_duration" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "search_results" ADD COLUMN "llm_duration" numeric(8, 2);