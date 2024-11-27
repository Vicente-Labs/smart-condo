CREATE TYPE "public"."maintenance_request_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD COLUMN "status" "maintenance_request_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD COLUMN "user_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
