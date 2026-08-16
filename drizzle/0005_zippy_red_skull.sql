CREATE TABLE "reading_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" timestamp NOT NULL,
	"chapter_id" integer NOT NULL,
	"views" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "publish_at" timestamp;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "notified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notify_new_chapters" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_stats" ADD CONSTRAINT "reading_stats_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reading_stats_chapter_idx" ON "reading_stats" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "reading_stats_day_idx" ON "reading_stats" USING btree ("day");