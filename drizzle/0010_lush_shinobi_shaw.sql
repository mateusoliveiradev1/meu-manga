ALTER TABLE "comments" ADD COLUMN "spoiler" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "edited_at" timestamp;