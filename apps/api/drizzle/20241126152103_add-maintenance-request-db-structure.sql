CREATE TABLE IF NOT EXISTS "maintenance_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"is_common_space" boolean DEFAULT false NOT NULL,
	"common_space_id" text,
	"condominium_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_common_space_id_common_spaces_id_fk" FOREIGN KEY ("common_space_id") REFERENCES "public"."common_spaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
