import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSequence,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* ---------------------------------------------------------------- enums */

export const userRole = pgEnum("user_role", ["admin", "staff"]);

export const propertyType = pgEnum("property_type", [
  "plot",
  "independent_house",
  "apartment",
  "villa",
  "commercial",
]);

export const transactionType = pgEnum("transaction_type", ["sale", "rent"]);

/** Publication state, shared by properties, projects and services. */
export const publicationStatus = pgEnum("publication_status", [
  "draft",
  "published",
  "archived",
]);

export const availability = pgEnum("availability", [
  "available",
  "under_offer",
  "sold",
  "rented",
  "unavailable",
]);

export const constructionStatus = pgEnum("construction_status", [
  "ready_to_move",
  "under_construction",
  "not_applicable",
]);

export const facing = pgEnum("facing", [
  "east",
  "west",
  "north",
  "south",
  "north_east",
  "north_west",
  "south_east",
  "south_west",
]);

export const areaUnit = pgEnum("area_unit", ["sq_yd", "sq_ft", "acre"]);

export const projectType = pgEnum("project_type", [
  "residential_house",
  "apartment_building",
  "commercial",
  "renovation",
  "other",
]);

export const projectStage = pgEnum("project_stage", ["ongoing", "completed"]);

export const enquiryCategory = pgEnum("enquiry_category", [
  "buy",
  "sell",
  "construction",
  "general",
]);

export const enquiryStatus = pgEnum("enquiry_status", [
  "new",
  "contacted",
  "follow_up",
  "qualified",
  "closed",
  "spam",
]);

export const contactMethod = pgEnum("contact_method", ["phone", "whatsapp", "email"]);

export const notificationStatus = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "skipped",
]);

/* ------------------------------------------------------------ sequences */

export const propertyRefSeq = pgSequence("property_ref_seq", { startWith: 1 });
export const projectRefSeq = pgSequence("project_ref_seq", { startWith: 1 });
export const enquiryRefSeq = pgSequence("enquiry_ref_seq", { startWith: 1 });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ---------------------------------------------------------- auth tables */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Always stored lower-cased; uniqueness is enforced on this column. */
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("staff"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token. The raw token only ever lives in the cookie. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/* ------------------------------------------------------------- content */

export const localities = pgTable("localities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference")
      .notNull()
      .unique()
      .default(sql`'HK-P-' || lpad(nextval('property_ref_seq')::text, 4, '0')`),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    type: propertyType("type").notNull(),
    transaction: transactionType("transaction").notNull().default("sale"),
    description: text("description").notNull().default(""),
    /** Whole rupees. Null when the price is not disclosed. */
    priceInr: bigint("price_inr", { mode: "number" }),
    priceOnRequest: boolean("price_on_request").notNull().default(false),
    priceNegotiable: boolean("price_negotiable").notNull().default(false),
    localityId: uuid("locality_id")
      .notNull()
      .references(() => localities.id, { onDelete: "restrict" }),
    /** Public, admin-written location description (e.g. "Off the main road, 5 min from …"). */
    locationNote: text("location_note"),
    /** Internal only. Never rendered publicly. */
    addressPrivate: text("address_private"),
    plotArea: numeric("plot_area", { precision: 12, scale: 2 }),
    plotAreaUnit: areaUnit("plot_area_unit"),
    builtUpAreaSqft: numeric("built_up_area_sqft", { precision: 10, scale: 2 }),
    carpetAreaSqft: numeric("carpet_area_sqft", { precision: 10, scale: 2 }),
    bedrooms: smallint("bedrooms"),
    bathrooms: smallint("bathrooms"),
    facing: facing("facing"),
    floorNumber: smallint("floor_number"),
    totalFloors: smallint("total_floors"),
    constructionStatus: constructionStatus("construction_status"),
    /** Free text entered by admin, e.g. "HMDA approved layout". Shown only when filled. */
    approvals: text("approvals"),
    reraNumber: text("rera_number"),
    features: text("features").array().notNull().default(sql`'{}'::text[]`),
    status: publicationStatus("status").notNull().default("draft"),
    availability: availability("availability").notNull().default("available"),
    isFeatured: boolean("is_featured").notNull().default(false),
    /** Synthetic development data. Never shown when APP_ENV=production. */
    isSample: boolean("is_sample").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("properties_public_idx").on(t.status, t.availability, t.publishedAt),
    index("properties_locality_idx").on(t.localityId),
    index("properties_type_idx").on(t.type),
    index("properties_price_idx").on(t.priceInr),
    check("properties_price_nonneg", sql`${t.priceInr} IS NULL OR ${t.priceInr} >= 0`),
    check(
      "properties_published_has_price",
      sql`${t.status} <> 'published' OR ${t.priceOnRequest} OR ${t.priceInr} IS NOT NULL`,
    ),
    check(
      "properties_plot_unit",
      sql`(${t.plotArea} IS NULL) = (${t.plotAreaUnit} IS NULL)`,
    ),
    check(
      "properties_rooms_range",
      sql`(${t.bedrooms} IS NULL OR ${t.bedrooms} BETWEEN 0 AND 20) AND (${t.bathrooms} IS NULL OR ${t.bathrooms} BETWEEN 0 AND 20)`,
    ),
  ],
);

export type ProjectSpec = { label: string; value: string };

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference")
      .notNull()
      .unique()
      .default(sql`'HK-J-' || lpad(nextval('project_ref_seq')::text, 4, '0')`),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    type: projectType("type").notNull(),
    stage: projectStage("stage").notNull(),
    localityId: uuid("locality_id").references(() => localities.id, { onDelete: "restrict" }),
    completionYear: smallint("completion_year"),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    specifications: jsonb("specifications").$type<ProjectSpec[]>().notNull().default([]),
    status: publicationStatus("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isSample: boolean("is_sample").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("projects_public_idx").on(t.status, t.publishedAt),
    check(
      "projects_year_range",
      sql`${t.completionYear} IS NULL OR ${t.completionYear} BETWEEN 1950 AND 2100`,
    ),
  ],
);

/** Photos for properties and projects. Exactly one owner per row. */
export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    /** Storage key prefix; variants live at `${storageKey}/${width}.webp`. */
    storageKey: text("storage_key").notNull().unique(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    /** Variant widths actually generated (never upscaled). */
    variants: integer("variants").array().notNull(),
    blurDataUrl: text("blur_data_url"),
    altText: text("alt_text").notNull().default(""),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    byteSize: integer("byte_size").notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("media_property_idx").on(t.propertyId, t.sortOrder),
    index("media_project_idx").on(t.projectId, t.sortOrder),
    check(
      "media_single_owner",
      sql`(${t.propertyId} IS NOT NULL)::int + (${t.projectId} IS NOT NULL)::int = 1`,
    ),
  ],
);

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  body: text("body").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  status: publicationStatus("status").notNull().default("draft"),
  isSample: boolean("is_sample").notNull().default(false),
  ...timestamps,
});

/* --------------------------------------------------------------- leads */

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference")
      .notNull()
      .unique()
      .default(sql`'HK-E-' || lpad(nextval('enquiry_ref_seq')::text, 5, '0')`),
    category: enquiryCategory("category").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    preferredContact: contactMethod("preferred_contact").notNull().default("phone"),
    message: text("message").notNull().default(""),
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    /** Snapshot so the lead keeps context even if the listing is later deleted. */
    subjectSnapshot: text("subject_snapshot"),
    sourcePath: text("source_path"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    consent: boolean("consent").notNull().default(false),
    consentVersion: text("consent_version"),
    status: enquiryStatus("status").notNull().default("new"),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    firstRespondedAt: timestamp("first_responded_at", { withTimezone: true }),
    notificationStatus: notificationStatus("notification_status").notNull().default("pending"),
    notificationError: text("notification_error"),
    /** Salted hash of the client IP, for abuse investigation only. */
    ipHash: text("ip_hash"),
    ...timestamps,
  },
  (t) => [
    index("enquiries_status_idx").on(t.status, t.createdAt),
    index("enquiries_assignee_idx").on(t.assignedTo),
    index("enquiries_property_idx").on(t.propertyId),
    check("enquiries_has_contact", sql`${t.phone} IS NOT NULL OR ${t.email} IS NOT NULL`),
  ],
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enquiryId: uuid("enquiry_id")
      .notNull()
      .references(() => enquiries.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lead_notes_enquiry_idx").on(t.enquiryId, t.createdAt)],
);

/* ------------------------------------------------------------ settings */

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  googleBusiness?: string;
};

export type HeroImage = {
  storageKey: string;
  width: number;
  height: number;
  variants: number[];
  blurDataUrl: string | null;
  altText: string;
};

/** Single-row table (id = 1) holding admin-verified business details. */
export const siteSettings = pgTable(
  "site_settings",
  {
    id: smallint("id").primaryKey().default(1),
    legalName: text("legal_name"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    notificationEmail: text("notification_email"),
    addressLine: text("address_line"),
    showAddress: boolean("show_address").notNull().default(false),
    openingHours: text("opening_hours"),
    mapUrl: text("map_url"),
    socials: jsonb("socials").$type<SocialLinks>().notNull().default({}),
    aboutText: text("about_text"),
    registrationsText: text("registrations_text"),
    heroImage: jsonb("hero_image").$type<HeroImage | null>(),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("site_settings_singleton", sql`${t.id} = 1`)],
);

/* --------------------------------------------------------- operations */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    /** Field names / small summaries only. Never passwords, tokens or lead contact details. */
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});
