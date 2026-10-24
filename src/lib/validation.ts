import { z } from "zod";
import {
  AREA_UNITS,
  AVAILABILITIES,
  CONSTRUCTION_STATUSES,
  CONTACT_METHODS,
  ENQUIRY_CATEGORIES,
  ENQUIRY_STATUSES,
  FACINGS,
  PROJECT_STAGES,
  PROJECT_TYPES,
  PROPERTY_TYPES,
  PUBLICATION_STATUSES,
  TRANSACTION_TYPES,
  USER_ROLES,
} from "./domain";
import { normalizeIndianPhone } from "./format";

/* --------------------------------------------------------------- helpers */

/** Field-level errors keyed by field name, ready for a form to display. */
export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    out[key] ??= issue.message;
  }
  return out;
}

/** FormData → plain object. Repeated keys become arrays; files are ignored. */
export function formToObject(form: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") continue;
    const prev = out[key];
    if (prev === undefined) out[key] = value;
    else out[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
  }
  return out;
}

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const text = (max: number, label: string) =>
  z.string({ error: `${label} is required` }).trim().max(max, `${label} must be ${max} characters or fewer`);

const optionalText = (max: number, label: string) =>
  z.preprocess(emptyToUndefined, text(max, label).optional());

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

const optionalInt = (label: string, min: number, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: `${label} must be a number` })
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be ${max} or less`)
      .optional(),
  );

const optionalDecimal = (label: string, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: `${label} must be a number` })
      .positive(`${label} must be greater than zero`)
      .max(max, `${label} looks too large — check the unit`)
      .optional(),
  );

const phone = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const n = normalizeIndianPhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Enter a 10-digit Indian phone number, e.g. 98480 12345" });
      return z.NEVER;
    }
    return n;
  });

const optionalPhone = z.preprocess(emptyToUndefined, phone.optional());
const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.email({ error: "Enter a valid email address, e.g. name@example.com" }).max(160).optional(),
);
const optionalUuid = z.preprocess(emptyToUndefined, z.uuid().optional());
const optionalUrl = z.preprocess(
  emptyToUndefined,
  z
    .url({ protocol: /^https?$/, error: "Enter a full web address starting with https://" })
    .max(500)
    .optional(),
);

/* --------------------------------------------------------------- enquiry */

export const CONSENT_VERSION = "2026-10-v1";

export const enquirySchema = z
  .object({
    category: z.enum(ENQUIRY_CATEGORIES, { error: "Choose what your enquiry is about" }),
    name: text(80, "Name").min(2, "Enter your name"),
    phone: optionalPhone,
    email: optionalEmail,
    preferredContact: z.enum(CONTACT_METHODS).default("phone"),
    message: z.preprocess(
      (v) => (typeof v === "string" ? v : ""),
      z.string().trim().max(2000, "Message must be 2,000 characters or fewer"),
    ),
    propertyId: optionalUuid,
    projectId: optionalUuid,
    consent: checkbox.refine((v) => v, "Please confirm HKNR may contact you about this enquiry"),
    sourcePath: optionalText(200, "Source"),
    utmSource: optionalText(100, "utm_source"),
    utmMedium: optionalText(100, "utm_medium"),
    utmCampaign: optionalText(100, "utm_campaign"),
  })
  .superRefine((v, ctx) => {
    if (!v.phone && !v.email) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a phone number or an email address so we can reply" });
    }
    if ((v.preferredContact === "phone" || v.preferredContact === "whatsapp") && !v.phone && v.email) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a phone number, or choose email as your preferred contact" });
    }
    if (v.preferredContact === "email" && !v.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Enter an email address, or choose phone as your preferred contact" });
    }
  });

export type EnquiryInput = z.infer<typeof enquirySchema>;

/* ---------------------------------------------------------------- admin */

export const loginSchema = z.object({
  email: z.email({ error: "Enter your email address" }).trim().toLowerCase().max(160),
  password: z.string().min(1, "Enter your password").max(200),
});

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(200, "Password is too long");

export const propertySchema = z
  .object({
    title: text(140, "Title").min(8, "Title should describe the property (at least 8 characters)"),
    type: z.enum(PROPERTY_TYPES, { error: "Choose a property type" }),
    transaction: z.enum(TRANSACTION_TYPES).default("sale"),
    localityId: z.uuid({ error: "Choose a locality" }),
    description: z.preprocess((v) => v ?? "", z.string().trim().max(6000, "Description must be 6,000 characters or fewer")),
    priceInr: z.preprocess(
      (v) => (typeof v === "string" ? emptyToUndefined(v.replace(/[,₹\s]/g, "")) : v),
      z.coerce
        .number({ error: "Price must be a number in rupees" })
        .int("Enter the price in whole rupees")
        .positive("Price must be greater than zero")
        .max(1_000_00_00_000, "Price looks too large — enter the amount in rupees")
        .optional(),
    ),
    priceOnRequest: checkbox,
    priceNegotiable: checkbox,
    locationNote: optionalText(300, "Location note"),
    addressPrivate: optionalText(300, "Address"),
    plotArea: optionalDecimal("Plot area", 1_000_000),
    plotAreaUnit: z.preprocess(emptyToUndefined, z.enum(AREA_UNITS).optional()),
    builtUpAreaSqft: optionalDecimal("Built-up area", 1_000_000),
    carpetAreaSqft: optionalDecimal("Carpet area", 1_000_000),
    bedrooms: optionalInt("Bedrooms", 0, 20),
    bathrooms: optionalInt("Bathrooms", 0, 20),
    facing: z.preprocess(emptyToUndefined, z.enum(FACINGS).optional()),
    floorNumber: optionalInt("Floor", -2, 100),
    totalFloors: optionalInt("Total floors", 1, 100),
    constructionStatus: z.preprocess(emptyToUndefined, z.enum(CONSTRUCTION_STATUSES).optional()),
    approvals: optionalText(300, "Approvals"),
    reraNumber: optionalText(60, "RERA number"),
    features: z.preprocess(
      (v) =>
        (typeof v === "string" ? v.split("\n") : Array.isArray(v) ? v : [])
          .map((s: string) => s.trim())
          .filter(Boolean),
      z.array(z.string().max(80, "Each feature must be 80 characters or fewer")).max(30, "Up to 30 features"),
    ),
    availability: z.enum(AVAILABILITIES).default("available"),
    isFeatured: checkbox,
  })
  .superRefine((v, ctx) => {
    if (v.plotArea != null && !v.plotAreaUnit) {
      ctx.addIssue({ code: "custom", path: ["plotAreaUnit"], message: "Choose the unit for the plot area" });
    }
    if (v.carpetAreaSqft != null && v.builtUpAreaSqft != null && v.carpetAreaSqft > v.builtUpAreaSqft) {
      ctx.addIssue({ code: "custom", path: ["carpetAreaSqft"], message: "Carpet area is usually smaller than built-up area — please check" });
    }
    if (v.floorNumber != null && v.totalFloors != null && v.floorNumber > v.totalFloors) {
      ctx.addIssue({ code: "custom", path: ["floorNumber"], message: "Floor cannot be higher than the total number of floors" });
    }
  });

export type PropertyInput = z.infer<typeof propertySchema>;

/** Extra rules that apply only when a listing is published. */
export function publishProblems(p: {
  priceInr: number | null;
  priceOnRequest: boolean;
  description: string;
  photoCount: number;
}): string[] {
  const problems: string[] = [];
  if (!p.priceOnRequest && p.priceInr == null) problems.push("Add a price, or tick “Price on request”.");
  if (p.description.trim().length < 40) problems.push("Write a description of at least 40 characters.");
  if (p.photoCount < 1) problems.push("Add at least one photo.");
  return problems;
}

export const projectSchema = z.object({
  title: text(140, "Title").min(4, "Enter a project title"),
  type: z.enum(PROJECT_TYPES, { error: "Choose a project type" }),
  stage: z.enum(PROJECT_STAGES, { error: "Choose ongoing or completed" }),
  localityId: optionalUuid,
  completionYear: optionalInt("Completion year", 1950, 2100),
  summary: z.preprocess((v) => v ?? "", z.string().trim().max(300, "Summary must be 300 characters or fewer")),
  description: z.preprocess((v) => v ?? "", z.string().trim().max(6000)),
  specifications: z.preprocess(
    (v) =>
      (typeof v === "string" ? v.split("\n") : [])
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((line: string) => {
          const idx = line.indexOf(":");
          return idx === -1 ? { label: line, value: "" } : { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
        }),
    z
      .array(z.object({ label: z.string().min(1).max(60), value: z.string().max(200) }))
      .max(30, "Up to 30 specification lines"),
  ),
  isFeatured: checkbox,
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const serviceSchema = z.object({
  title: text(100, "Title").min(3, "Enter a service title"),
  summary: z.preprocess((v) => v ?? "", z.string().trim().max(300)),
  body: z.preprocess((v) => v ?? "", z.string().trim().max(4000)),
  sortOrder: optionalInt("Order", 0, 1000).transform((v) => v ?? 0),
  status: z.enum(PUBLICATION_STATUSES).default("draft"),
});

export const localitySchema = z.object({
  name: text(80, "Name").min(2, "Enter the locality name"),
  sortOrder: optionalInt("Order", 0, 1000).transform((v) => v ?? 0),
});

export const settingsSchema = z
  .object({
    legalName: optionalText(120, "Business name"),
    phone: optionalPhone,
    whatsapp: optionalPhone,
    email: optionalEmail,
    notificationEmail: optionalEmail,
    addressLine: optionalText(300, "Address"),
    showAddress: checkbox,
    openingHours: optionalText(300, "Opening hours"),
    mapUrl: optionalUrl,
    instagram: optionalUrl,
    facebook: optionalUrl,
    youtube: optionalUrl,
    googleBusiness: optionalUrl,
    aboutText: optionalText(5000, "About text"),
    registrationsText: optionalText(500, "Registrations"),
  })
  .superRefine((v, ctx) => {
    if (v.showAddress && !v.addressLine) {
      ctx.addIssue({ code: "custom", path: ["addressLine"], message: "Enter the address, or untick “Show address publicly”" });
    }
  });

export const userCreateSchema = z.object({
  name: text(80, "Name").min(2, "Enter the person's name"),
  email: z.email({ error: "Enter a valid email address" }).trim().toLowerCase().max(160),
  role: z.enum(USER_ROLES),
  password: passwordSchema,
});

export const enquiryUpdateSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
  assignedTo: optionalUuid,
  nextFollowUpAt: z.preprocess(emptyToUndefined, z.coerce.date({ error: "Enter a valid date" }).optional()),
});

export const noteSchema = z.object({
  body: text(2000, "Note").min(1, "Write a note before saving"),
});
