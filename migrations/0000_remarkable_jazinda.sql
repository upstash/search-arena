CREATE TYPE "public"."provider_type" AS ENUM('algolia', 'upstash_search');--> statement-breakpoint
CREATE TABLE "battle_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_id" uuid NOT NULL,
	"query_text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(255) NOT NULL,
	"database_id_1" uuid NOT NULL,
	"database_id_2" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"mean_score_db1" numeric(4, 2),
	"mean_score_db2" numeric(4, 2)
);
--> statement-breakpoint
CREATE TABLE "database_credentials" (
	"database_id" uuid PRIMARY KEY NOT NULL,
	"algolia_application_id" varchar(255),
	"algolia_api_key" varchar(255),
	"algolia_index" varchar(255),
	"upstash_url" text,
	"upstash_token" text,
	"upstash_index" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "databases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(255) NOT NULL,
	"provider" "provider_type" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_query_id" uuid NOT NULL,
	"database_id" uuid NOT NULL,
	"results" jsonb NOT NULL,
	"score" numeric(4, 2),
	"llm_feedback" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "search_results_battle_query_id_database_id_unique" UNIQUE("battle_query_id","database_id")
);
--> statement-breakpoint
ALTER TABLE "battle_queries" ADD CONSTRAINT "battle_queries_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_database_id_1_databases_id_fk" FOREIGN KEY ("database_id_1") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_database_id_2_databases_id_fk" FOREIGN KEY ("database_id_2") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_credentials" ADD CONSTRAINT "database_credentials_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_results" ADD CONSTRAINT "search_results_battle_query_id_battle_queries_id_fk" FOREIGN KEY ("battle_query_id") REFERENCES "public"."battle_queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_results" ADD CONSTRAINT "search_results_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;