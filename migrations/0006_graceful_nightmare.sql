CREATE TYPE "public"."battle_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "battles" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."battle_status";--> statement-breakpoint
ALTER TABLE "battles" ALTER COLUMN "status" SET DATA TYPE "public"."battle_status" USING "status"::"public"."battle_status";