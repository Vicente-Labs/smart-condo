ALTER TABLE "invites" DROP CONSTRAINT "invites_condominium_id_condominiums_id_fk";
--> statement-breakpoint
ALTER TABLE "common_spaces" DROP CONSTRAINT "common_spaces_condominium_id_condominiums_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_condominium_id_condominiums_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_announcer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_common_space_id_common_spaces_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_condominium_id_condominiums_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "condominium_residents" DROP CONSTRAINT "condominium_residents_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "condominium_residents" DROP CONSTRAINT "condominium_residents_condominium_id_condominiums_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "announcer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "condominium_residents" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "condominium_residents" ALTER COLUMN "condominium_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invites" ADD CONSTRAINT "invites_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "common_spaces" ADD CONSTRAINT "common_spaces_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "announcements" ADD CONSTRAINT "announcements_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "announcements" ADD CONSTRAINT "announcements_announcer_id_users_id_fk" FOREIGN KEY ("announcer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_common_space_id_common_spaces_id_fk" FOREIGN KEY ("common_space_id") REFERENCES "public"."common_spaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "condominium_residents" ADD CONSTRAINT "condominium_residents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "condominium_residents" ADD CONSTRAINT "condominium_residents_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "address_idx" ON "condominiums" USING btree ("address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "owner_id_idx" ON "condominiums" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "created_at_idx" ON "condominiums" USING btree ("created_at");