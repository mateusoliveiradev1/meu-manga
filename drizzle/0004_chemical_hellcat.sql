CREATE TABLE "series_ratings" (
	"user_id" text NOT NULL,
	"series_id" integer NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "series_ratings_user_id_series_id_pk" PRIMARY KEY("user_id","series_id")
);
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "chapter_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "series_id" integer;--> statement-breakpoint
ALTER TABLE "series_ratings" ADD CONSTRAINT "series_ratings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series_ratings" ADD CONSTRAINT "series_ratings_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ratings_series_idx" ON "series_ratings" USING btree ("series_id");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_series_idx" ON "comments" USING btree ("series_id");