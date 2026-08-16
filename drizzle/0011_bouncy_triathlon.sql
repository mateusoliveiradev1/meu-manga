ALTER TABLE "user" ADD COLUMN "favorites_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "comments_public" boolean DEFAULT true NOT NULL;