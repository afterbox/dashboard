ALTER TABLE "person" ALTER COLUMN "relationship" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN "relationship_label" text;