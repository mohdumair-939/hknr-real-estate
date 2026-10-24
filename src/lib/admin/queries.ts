import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, isNull, max, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  auditLogs,
  enquiries,
  leadNotes,
  localities,
  media,
  projects,
  properties,
  services,
  siteSettings,
  users,
} from "@/lib/db/schema";
import type { EnquiryCategory, EnquiryStatus, PublicationStatus } from "@/lib/domain";

/*
 * Read models for the admin panel. Uncached by design: staff must see the current state.
 * Callers are admin pages, which have already verified the session.
 */

export async function dashboardStats() {
  const [props, projs, newLeads, unassigned, followUps] = await Promise.all([
    db.select({ status: properties.status, n: count() }).from(properties).groupBy(properties.status),
    db.select({ status: projects.status, n: count() }).from(projects).groupBy(projects.status),
    db.select({ n: count() }).from(enquiries).where(eq(enquiries.status, "new")),
    db
      .select({ n: count() })
      .from(enquiries)
      .where(and(isNull(enquiries.assignedTo), inArray(enquiries.status, ["new", "contacted", "follow_up", "qualified"]))),
    db
      .select({ n: count() })
      .from(enquiries)
      .where(and(sql`${enquiries.nextFollowUpAt} <= now() + interval '1 day'`, inArray(enquiries.status, ["contacted", "follow_up", "qualified"]))),
  ]);
  const by = (rows: { status: PublicationStatus; n: number }[], s: PublicationStatus) => rows.find((r) => r.status === s)?.n ?? 0;
  return {
    properties: { published: by(props, "published"), draft: by(props, "draft"), archived: by(props, "archived") },
    projects: { published: by(projs, "published"), draft: by(projs, "draft") },
    newLeads: newLeads[0]?.n ?? 0,
    unassigned: unassigned[0]?.n ?? 0,
    followUpsDue: followUps[0]?.n ?? 0,
  };
}

/* ------------------------------------------------------------ enquiries */

export type EnquiryListFilters = {
  status?: EnquiryStatus | "open" | "all";
  category?: EnquiryCategory;
  assignee?: string | "me" | "none";
  q?: string;
  page: number;
};

export const ENQUIRY_PAGE_SIZE = 25;

export async function listEnquiries(f: EnquiryListFilters, meId: string) {
  const conds: SQL[] = [];
  if (!f.status || f.status === "open") conds.push(inArray(enquiries.status, ["new", "contacted", "follow_up", "qualified"]));
  else if (f.status !== "all") conds.push(eq(enquiries.status, f.status));
  if (f.category) conds.push(eq(enquiries.category, f.category));
  if (f.assignee === "me") conds.push(eq(enquiries.assignedTo, meId));
  else if (f.assignee === "none") conds.push(isNull(enquiries.assignedTo));
  else if (f.assignee) conds.push(eq(enquiries.assignedTo, f.assignee));
  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conds.push(
      or(
        ilike(enquiries.name, like),
        ilike(enquiries.reference, like),
        ilike(enquiries.phone, like),
        ilike(enquiries.email, like),
        ilike(enquiries.subjectSnapshot, like),
      )!,
    );
  }
  const where = conds.length ? and(...conds) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(enquiries).where(where);
  const rows = await db
    .select({
      id: enquiries.id,
      reference: enquiries.reference,
      name: enquiries.name,
      phone: enquiries.phone,
      email: enquiries.email,
      category: enquiries.category,
      status: enquiries.status,
      subject: enquiries.subjectSnapshot,
      createdAt: enquiries.createdAt,
      nextFollowUpAt: enquiries.nextFollowUpAt,
      assigneeName: users.name,
      notificationStatus: enquiries.notificationStatus,
    })
    .from(enquiries)
    .leftJoin(users, eq(users.id, enquiries.assignedTo))
    .where(where)
    .orderBy(desc(enquiries.createdAt))
    .limit(ENQUIRY_PAGE_SIZE)
    .offset((f.page - 1) * ENQUIRY_PAGE_SIZE);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / ENQUIRY_PAGE_SIZE)) };
}

export async function getEnquiry(id: string) {
  const [e] = await db
    .select({
      enquiry: enquiries,
      propertySlug: properties.slug,
      propertyId: properties.id,
      projectSlug: projects.slug,
    })
    .from(enquiries)
    .leftJoin(properties, eq(properties.id, enquiries.propertyId))
    .leftJoin(projects, eq(projects.id, enquiries.projectId))
    .where(eq(enquiries.id, id))
    .limit(1);
  if (!e) return null;
  const notes = await db
    .select({ id: leadNotes.id, body: leadNotes.body, createdAt: leadNotes.createdAt, author: users.name })
    .from(leadNotes)
    .leftJoin(users, eq(users.id, leadNotes.authorId))
    .where(eq(leadNotes.enquiryId, id))
    .orderBy(desc(leadNotes.createdAt));
  return { ...e, notes };
}

export async function recentEnquiries(limit = 6) {
  return db
    .select({
      id: enquiries.id,
      reference: enquiries.reference,
      name: enquiries.name,
      category: enquiries.category,
      status: enquiries.status,
      createdAt: enquiries.createdAt,
      subject: enquiries.subjectSnapshot,
    })
    .from(enquiries)
    .where(ne(enquiries.status, "spam"))
    .orderBy(desc(enquiries.createdAt))
    .limit(limit);
}

/* ----------------------------------------------------------- properties */

export async function listProperties(f: { status?: PublicationStatus | "all"; q?: string }) {
  const conds: SQL[] = [];
  if (f.status && f.status !== "all") conds.push(eq(properties.status, f.status));
  else conds.push(ne(properties.status, "archived"));
  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conds.push(or(ilike(properties.title, like), ilike(properties.reference, like), ilike(localities.name, like))!);
  }
  const photoCount = db
    .select({ propertyId: media.propertyId, n: count().as("n") })
    .from(media)
    .groupBy(media.propertyId)
    .as("pc");
  return db
    .select({
      id: properties.id,
      reference: properties.reference,
      title: properties.title,
      type: properties.type,
      status: properties.status,
      availability: properties.availability,
      priceInr: properties.priceInr,
      priceOnRequest: properties.priceOnRequest,
      isFeatured: properties.isFeatured,
      isSample: properties.isSample,
      localityName: localities.name,
      updatedAt: properties.updatedAt,
      photos: sql<number>`coalesce(${photoCount.n}, 0)`.mapWith(Number),
    })
    .from(properties)
    .innerJoin(localities, eq(localities.id, properties.localityId))
    .leftJoin(photoCount, eq(photoCount.propertyId, properties.id))
    .where(and(...conds))
    .orderBy(desc(properties.updatedAt))
    .limit(500);
}

export async function propertyStatusCounts() {
  const rows = await db.select({ status: properties.status, n: count() }).from(properties).groupBy(properties.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<PublicationStatus, number>>;
}

export async function getPropertyForAdmin(id: string) {
  const [p] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  if (!p) return null;
  const photos = await db
    .select()
    .from(media)
    .where(eq(media.propertyId, id))
    .orderBy(asc(media.sortOrder), asc(media.createdAt));
  return { ...p, photos };
}

/** Same shape as the public detail query, without the published filter, for admin preview. */
export async function getPropertyPreview(id: string) {
  const [row] = await db
    .select({ p: properties, localityName: localities.name, localitySlug: localities.slug })
    .from(properties)
    .innerJoin(localities, eq(localities.id, properties.localityId))
    .where(eq(properties.id, id))
    .limit(1);
  if (!row) return null;
  const images = await db
    .select({
      storageKey: media.storageKey,
      width: media.width,
      height: media.height,
      variants: media.variants,
      blurDataUrl: media.blurDataUrl,
      altText: media.altText,
      caption: media.caption,
    })
    .from(media)
    .where(eq(media.propertyId, id))
    .orderBy(asc(media.sortOrder), asc(media.createdAt));
  return { ...row.p, localityName: row.localityName, localitySlug: row.localitySlug, images };
}

/**
 * Possible duplicates: same locality and type, with matching plot or built-up area,
 * or a near-identical title. Only ever a warning; records are never merged.
 */
export async function findPossibleDuplicates(input: {
  localityId: string;
  type: string;
  title: string;
  plotArea?: number;
  builtUpAreaSqft?: number;
  excludeId?: string;
}) {
  const conds: SQL[] = [eq(properties.localityId, input.localityId), ne(properties.status, "archived")];
  if (input.excludeId) conds.push(ne(properties.id, input.excludeId));
  const match: SQL[] = [sql`lower(${properties.title}) = lower(${input.title})`];
  if (input.plotArea != null) match.push(and(eq(properties.type, input.type as never), eq(properties.plotArea, String(input.plotArea)))!);
  if (input.builtUpAreaSqft != null)
    match.push(and(eq(properties.type, input.type as never), eq(properties.builtUpAreaSqft, String(input.builtUpAreaSqft)))!);
  return db
    .select({ id: properties.id, reference: properties.reference, title: properties.title, status: properties.status })
    .from(properties)
    .where(and(...conds, or(...match)))
    .limit(5);
}

/* ------------------------------------------------------------- projects */

export async function listProjects() {
  return db
    .select({
      id: projects.id,
      reference: projects.reference,
      title: projects.title,
      type: projects.type,
      stage: projects.stage,
      status: projects.status,
      isFeatured: projects.isFeatured,
      isSample: projects.isSample,
      updatedAt: projects.updatedAt,
      localityName: localities.name,
      photos: sql<number>`(select count(*) from ${media} where ${media.projectId} = ${projects.id})`.mapWith(Number),
    })
    .from(projects)
    .leftJoin(localities, eq(localities.id, projects.localityId))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectForAdmin(id: string) {
  const [p] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!p) return null;
  const photos = await db.select().from(media).where(eq(media.projectId, id)).orderBy(asc(media.sortOrder), asc(media.createdAt));
  return { ...p, photos };
}

/* ---------------------------------------------------------------- other */

export async function listLocalities() {
  const usage = db
    .select({ localityId: properties.localityId, n: count().as("n") })
    .from(properties)
    .groupBy(properties.localityId)
    .as("u");
  return db
    .select({
      id: localities.id,
      name: localities.name,
      slug: localities.slug,
      sortOrder: localities.sortOrder,
      properties: sql<number>`coalesce(${usage.n}, 0)`.mapWith(Number),
    })
    .from(localities)
    .leftJoin(usage, eq(usage.localityId, localities.id))
    .orderBy(asc(localities.sortOrder), asc(localities.name));
}

export async function listServices() {
  return db.select().from(services).orderBy(asc(services.sortOrder), asc(services.title));
}

export async function getSettings() {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row ?? null;
}

export async function listUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.isActive), asc(users.name));
}

export async function activeStaff() {
  return db.select({ id: users.id, name: users.name }).from(users).where(eq(users.isActive, true)).orderBy(asc(users.name));
}

export async function listAudit(limit = 100) {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
      actor: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function nextSortOrder(owner: { propertyId?: string; projectId?: string }) {
  const [r] = await db
    .select({ m: max(media.sortOrder) })
    .from(media)
    .where(owner.propertyId ? eq(media.propertyId, owner.propertyId) : eq(media.projectId, owner.projectId!));
  return (r?.m ?? -1) + 1;
}
