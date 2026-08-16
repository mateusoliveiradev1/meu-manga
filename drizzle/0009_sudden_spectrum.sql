ALTER TABLE "rate_limits" ADD COLUMN "id" text;--> statement-breakpoint
UPDATE "rate_limits" SET "id" = "key" WHERE "id" IS NULL;--> statement-breakpoint
ALTER TABLE "rate_limits" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_id_unique" UNIQUE("id");
