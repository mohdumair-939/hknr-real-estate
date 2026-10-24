CREATE TYPE "public"."area_unit" AS ENUM('sq_yd', 'sq_ft', 'acre');--> statement-breakpoint
CREATE TYPE "public"."availability" AS ENUM('available', 'under_offer', 'sold', 'rented', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."construction_status" AS ENUM('ready_to_move', 'under_construction', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."contact_method" AS ENUM('phone', 'whatsapp', 'email');--> statement-breakpoint
CREATE TYPE "public"."enquiry_category" AS ENUM('buy', 'sell', 'construction', 'general');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'contacted', 'follow_up', 'qualified', 'closed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."facing" AS ENUM('east', 'west', 'north', 'south', 'north_east', 'north_west', 'south_east', 'south_west');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('ongoing', 'completed');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('residential_house', 'apartment_building', 'commercial', 'renovation', 'other');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('plot', 'independent_house', 'apartment', 'villa', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('sale', 'rent');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'staff');--> statement-breakpoint
CREATE SEQUENCE "public"."enquiry_ref_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."project_ref_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."property_ref_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text DEFAULT 'HK-E-' || lpad(nextval('enquiry_ref_seq')::text, 5, '0') NOT NULL,
	"category" "enquiry_category" NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"preferred_contact" "contact_method" DEFAULT 'phone' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"property_id" uuid,
	"project_id" uuid,
	"subject_snapshot" text,
	"source_path" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"consent" boolean DEFAULT false NOT NULL,
	"consent_version" text,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"assigned_to" uuid,
	"next_follow_up_at" timestamp with time zone,
	"first_responded_at" timestamp with time zone,
	"notification_status" "notification_status" DEFAULT 'pending' NOT NULL,
	"notification_error" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enquiries_reference_unique" UNIQUE("reference"),
	CONSTRAINT "enquiries_has_contact" CHECK ("enquiries"."phone" IS NOT NULL OR "enquiries"."email" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "localities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "localities_name_unique" UNIQUE("name"),
	CONSTRAINT "localities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"project_id" uuid,
	"storage_key" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"variants" integer[] NOT NULL,
	"blur_data_url" text,
	"alt_text" text DEFAULT '' NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"byte_size" integer NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "media_single_owner" CHECK (("media"."property_id" IS NOT NULL)::int + ("media"."project_id" IS NOT NULL)::int = 1)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text DEFAULT 'HK-J-' || lpad(nextval('project_ref_seq')::text, 4, '0') NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"type" "project_type" NOT NULL,
	"stage" "project_stage" NOT NULL,
	"locality_id" uuid,
	"completion_year" smallint,
	"summary" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"specifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_reference_unique" UNIQUE("reference"),
	CONSTRAINT "projects_slug_unique" UNIQUE("slug"),
	CONSTRAINT "projects_year_range" CHECK ("projects"."completion_year" IS NULL OR "projects"."completion_year" BETWEEN 1950 AND 2100)
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text DEFAULT 'HK-P-' || lpad(nextval('property_ref_seq')::text, 4, '0') NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"type" "property_type" NOT NULL,
	"transaction" "transaction_type" DEFAULT 'sale' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_inr" bigint,
	"price_on_request" boolean DEFAULT false NOT NULL,
	"price_negotiable" boolean DEFAULT false NOT NULL,
	"locality_id" uuid NOT NULL,
	"location_note" text,
	"address_private" text,
	"plot_area" numeric(12, 2),
	"plot_area_unit" "area_unit",
	"built_up_area_sqft" numeric(10, 2),
	"carpet_area_sqft" numeric(10, 2),
	"bedrooms" smallint,
	"bathrooms" smallint,
	"facing" "facing",
	"floor_number" smallint,
	"total_floors" smallint,
	"construction_status" "construction_status",
	"approvals" text,
	"rera_number" text,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"availability" "availability" DEFAULT 'available' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_reference_unique" UNIQUE("reference"),
	CONSTRAINT "properties_slug_unique" UNIQUE("slug"),
	CONSTRAINT "properties_price_nonneg" CHECK ("properties"."price_inr" IS NULL OR "properties"."price_inr" >= 0),
	CONSTRAINT "properties_published_has_price" CHECK ("properties"."status" <> 'published' OR "properties"."price_on_request" OR "properties"."price_inr" IS NOT NULL),
	CONSTRAINT "properties_plot_unit" CHECK (("properties"."plot_area" IS NULL) = ("properties"."plot_area_unit" IS NULL)),
	CONSTRAINT "properties_rooms_range" CHECK (("properties"."bedrooms" IS NULL OR "properties"."bedrooms" BETWEEN 0 AND 20) AND ("properties"."bathrooms" IS NULL OR "properties"."bathrooms" BETWEEN 0 AND 20))
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"legal_name" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"notification_email" text,
	"address_line" text,
	"show_address" boolean DEFAULT false NOT NULL,
	"opening_hours" text,
	"map_url" text,
	"socials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"about_text" text,
	"registrations_text" text,
	"hero_image" jsonb,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK ("site_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'staff' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"password_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "enquiries_assignee_idx" ON "enquiries" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "enquiries_property_idx" ON "enquiries" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "lead_notes_enquiry_idx" ON "lead_notes" USING btree ("enquiry_id","created_at");--> statement-breakpoint
CREATE INDEX "media_property_idx" ON "media" USING btree ("property_id","sort_order");--> statement-breakpoint
CREATE INDEX "media_project_idx" ON "media" USING btree ("project_id","sort_order");--> statement-breakpoint
CREATE INDEX "projects_public_idx" ON "projects" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "properties_public_idx" ON "properties" USING btree ("status","availability","published_at");--> statement-breakpoint
CREATE INDEX "properties_locality_idx" ON "properties" USING btree ("locality_id");--> statement-breakpoint
CREATE INDEX "properties_type_idx" ON "properties" USING btree ("type");--> statement-breakpoint
CREATE INDEX "properties_price_idx" ON "properties" USING btree ("price_inr");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");