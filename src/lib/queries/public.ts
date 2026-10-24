import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import { localities, media, projects, properties, services, siteSettings } from "@/lib/db/schema";
import type { PropertyType, TransactionType } from "@/lib/domain";
import { showSampleContent } from "@/lib/env";
import { PAGE_SIZE, type PropertyFilters } from "@/lib/filters";

/*
 * Everything in this file is public, cached, and tagged. Admin mutations call
 * updateTag()/revalidateTag() with the same tags (see lib/cache-tags.ts).
 * Only published (and, in production, non-sample) rows are ever returned.
 */

export type PublicImage = {
  storageKey: string;
  width: number;
  height: number;
  variants: number[];
  blurDataUrl: string | null;
  altText: string;
  caption: string | null;
};

const imageColumns = {
  storageKey: media.storageKey,
  width: media.width,
  height: media.height,
  variants: media.variants,
  blurDataUrl: media.blurDataUrl,
  altText: media.altText,
  caption: media.caption,
};

function publishedProperty(): SQL {
  const conds = [eq(properties.status, "published")];
  if (!showSampleContent()) conds.push(eq(properties.isSample, false));
  return and(...conds)!;
}

function publishedProject(): SQL {
  const conds = [eq(projects.status, "published")];
  if (!showSampleContent()) conds.push(eq(projects.isSample, false));
  return and(...conds)!;
}

/* -------------------------------------------------------------- settings */

export type PublicSettings = {
  legalName: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  openingHours: string | null;
  mapUrl: string | null;
  socials: { instagram?: string; facebook?: string; youtube?: string; googleBusiness?: string };
  aboutText: string | null;
  registrationsText: string | null;
  heroImage: PublicImage | null;
};

export async function getPublicSettings(): Promise<PublicSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return {
    legalName: row?.legalName ?? null,
    phone: row?.phone ?? null,
    whatsapp: row?.whatsapp ?? null,
    email: row?.email ?? null,
    address: row?.showAddress ? (row.addressLine ?? null) : null,
    openingHours: row?.openingHours ?? null,
    mapUrl: row?.mapUrl ?? null,
    socials: row?.socials ?? {},
    aboutText: row?.aboutText ?? null,
    registrationsText: row?.registrationsText ?? null,
    heroImage: row?.heroImage ? { ...row.heroImage, caption: null } : null,
  };
}

/* ------------------------------------------------------------ properties */

export type PropertyCardData = {
  id: string;
  slug: string;
  reference: string;
  title: string;
  type: PropertyType;
  transaction: TransactionType;
  priceInr: number | null;
  priceOnRequest: boolean;
  localityName: string;
  plotArea: string | null;
  plotAreaUnit: "sq_yd" | "sq_ft" | "acre" | null;
  builtUpAreaSqft: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  availability: "available" | "under_offer" | "sold" | "rented" | "unavailable";
  isSample: boolean;
  cover: PublicImage | null;
};

const cardColumns = {
  id: properties.id,
  slug: properties.slug,
  reference: properties.reference,
  title: properties.title,
  type: properties.type,
  transaction: properties.transaction,
  priceInr: properties.priceInr,
  priceOnRequest: properties.priceOnRequest,
  localityName: localities.name,
  plotArea: properties.plotArea,
  plotAreaUnit: properties.plotAreaUnit,
  builtUpAreaSqft: properties.builtUpAreaSqft,
  bedrooms: properties.bedrooms,
  bathrooms: properties.bathrooms,
  availability: properties.availability,
  isSample: properties.isSample,
};

async function attachCovers<T extends { id: string }>(rows: T[]): Promise<(T & { cover: PublicImage | null })[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  // First photo per property by sort order.
  const covers = await db
    .selectDistinctOn([media.propertyId], { propertyId: media.propertyId, ...imageColumns })
    .from(media)
    .where(inArray(media.propertyId, ids))
    .orderBy(media.propertyId, asc(media.sortOrder), asc(media.createdAt));
  const byId = new Map(covers.map(({ propertyId, ...img }) => [propertyId, img]));
  return rows.map((r) => ({ ...r, cover: byId.get(r.id) ?? null }));
}

export async function getFeaturedProperties(limit = 6): Promise<PropertyCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("properties");
  const rows = await db
    .select(cardColumns)
    .from(properties)
    .innerJoin(localities, eq(localities.id, properties.localityId))
    .where(and(publishedProperty(), inArray(properties.availability, ["available", "under_offer"])))
    .orderBy(desc(properties.isFeatured), desc(properties.publishedAt))
    .limit(limit);
  return attachCovers(rows);
}

export type SearchResult = { items: PropertyCardData[]; total: number; page: number; pageCount: number };

export async function searchProperties(f: PropertyFilters): Promise<SearchResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("properties");

  const conds: SQL[] = [publishedProperty()];
  if (f.type) conds.push(eq(properties.type, f.type));
  if (f.txn) conds.push(eq(properties.transaction, f.txn));
  if (f.locality) conds.push(eq(localities.slug, f.locality));
  if (f.min) conds.push(gte(properties.priceInr, f.min));
  if (f.max) conds.push(lte(properties.priceInr, f.max));
  if (f.beds) conds.push(gte(properties.bedrooms, f.beds));
  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conds.push(
      or(
        ilike(properties.title, like),
        ilike(properties.reference, like),
        ilike(localities.name, like),
        ilike(properties.description, like),
      )!,
    );
  }
  const where = and(...conds);

  // Sold / unavailable listings sort after available ones, whatever the chosen order.
  const availabilityRank = sql`CASE ${properties.availability} WHEN 'available' THEN 0 WHEN 'under_offer' THEN 1 ELSE 2 END`;
  const order =
    f.sort === "price_asc"
      ? [availabilityRank, sql`${properties.priceInr} ASC NULLS LAST`]
      : f.sort === "price_desc"
        ? [availabilityRank, sql`${properties.priceInr} DESC NULLS LAST`]
        : [availabilityRank, desc(properties.publishedAt)];

  const [{ total }] = await db
    .select({ total: count() })
    .from(properties)
    .innerJoin(localities, eq(localities.id, properties.localityId))
    .where(where);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(f.page, pageCount);
  const rows = await db
    .select(cardColumns)
    .from(properties)
    .innerJoin(localities, eq(localities.id, properties.localityId))
    .where(where)
    .orderBy(...order, asc(properties.id))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return { items: await attachCovers(rows), total, page, pageCount };
}

export type Facets = {
  types: { value: PropertyType; count: number }[];
  transactions: TransactionType[];
  localities: { slug: string; name: string; count: number }[];
  hasBedrooms: boolean;
  total: number;
};

/** Filter options derived from what is actually published, so no filter can lead to a dead end by design. */
export async function getPropertyFacets(): Promise<Facets> {
  "use cache";
  cacheLife("hours");
  cacheTag("properties");
  cacheTag("localities");
  const base = publishedProperty();
  const [types, txns, locs, beds] = await Promise.all([
    db.select({ value: properties.type, count: count() }).from(properties).where(base).groupBy(properties.type),
    db.selectDistinct({ value: properties.transaction }).from(properties).where(base),
    db
      .select({ slug: localities.slug, name: localities.name, count: count() })
      .from(properties)
      .innerJoin(localities, eq(localities.id, properties.localityId))
      .where(base)
      .groupBy(localities.id, localities.slug, localities.name, localities.sortOrder)
      .orderBy(asc(localities.sortOrder), asc(localities.name)),
    db.select({ n: count() }).from(properties).where(and(base, sql`${properties.bedrooms} IS NOT NULL`)),
  ]);
  return {
    types: types.sort((a, b) => b.count - a.count),
    transactions: txns.map((t) => t.value),
    localities: locs,
    hasBedrooms: (beds[0]?.n ?? 0) > 0,
    total: types.reduce((n, t) => n + t.count, 0),
  };
}

export async function getPropertyBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("properties");
  const [row] = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      reference: properties.reference,
      title: properties.title,
      type: properties.type,
      transaction: properties.transaction,
      description: properties.description,
      priceInr: properties.priceInr,
      priceOnRequest: properties.priceOnRequest,
      priceNegotiable: properties.priceNegotiable,
      localityId: properties.localityId,
      localityName: localities.name,
      localitySlug: localities.slug,
      locationNote: properties.locationNote,
      plotArea: properties.plotArea,
      plotAreaUnit: properties.plotAreaUnit,
      builtUpAreaSqft: properties.builtUpAreaSqft,
      carpetAreaSqft: properties.carpetAreaSqft,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      facing: properties.facing,
      floorNumber: properties.floorNumber,
      totalFloors: properties.totalFloors,
      constructionStatus: properties.constructionStatus,
      approvals: properties.approvals,
      reraNumber: properties.reraNumber,
      features: properties.features,
      availability: properties.availability,
      isSample: properties.isSample,
      publishedAt: properties.publishedAt,
      updatedAt: properties.updatedAt,
    })
    .from(properties)
    .innerJoin(localities, eq(localities.id, properties.localityId))
    .where(and(eq(properties.slug, slug), publishedProperty()))
    .limit(1);
  if (!row) return null;
  const images = await db
    .select(imageColumns)
    .from(media)
    .where(eq(media.propertyId, row.id))
    .orderBy(asc(media.sortOrder), asc(media.createdAt));
  return { ...row, images };
}

export type PublicProperty = NonNullable<Awaited<ReturnType<typeof getPropertyBySlug>>>;

export async function getRelatedProperties(p: { id: string; type: PropertyType; localityId: string }, limit = 3) {
  "use cache";
  cacheLife("hours");
  cacheTag("properties");
  // Same locality or same type, ranked by how many of the two match.
  const score = sql`(CASE WHEN ${properties.localityId} = ${p.localityId} THEN 2 ELSE 0 END + CASE WHEN ${properties.type} = ${p.type} THEN 1 ELSE 0 END)`;
  const rows = await db
    .select(cardColumns)
    .from(properties)
    .innerJoin(localities, eq(localities.id, properties.localityId))
    .where(
      and(
        publishedProperty(),
        ne(properties.id, p.id),
        inArray(properties.availability, ["available", "under_offer"]),
        or(eq(properties.localityId, p.localityId), eq(properties.type, p.type)),
      ),
    )
    .orderBy(desc(score), desc(properties.publishedAt))
    .limit(limit);
  return attachCovers(rows);
}

/** Minimal card data for browser-stored "saved"/"recently viewed" lists. Unknown or unpublished ids are dropped. */
export async function getPropertyCardsByIds(ids: string[]): Promise<PropertyCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("properties");
  if (ids.length === 0) return [];
  const rows = await db
    .select(cardColumns)
    .from(properties)
    .innerJoin(localities, eq(localities.id, properties.localityId))
    .where(and(publishedProperty(), inArray(properties.id, ids.slice(0, 24))));
  const withCovers = await attachCovers(rows);
  const order = new Map(ids.map((id, i) => [id, i]));
  return withCovers.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

/* -------------------------------------------------------------- projects */

export async function getPublishedProjects(opts: { featuredOnly?: boolean; limit?: number } = {}) {
  "use cache";
  cacheLife("hours");
  cacheTag("projects");
  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      type: projects.type,
      stage: projects.stage,
      completionYear: projects.completionYear,
      summary: projects.summary,
      localityName: localities.name,
      isSample: projects.isSample,
    })
    .from(projects)
    .leftJoin(localities, eq(localities.id, projects.localityId))
    .where(opts.featuredOnly ? and(publishedProject(), eq(projects.isFeatured, true)) : publishedProject())
    .orderBy(desc(projects.isFeatured), desc(projects.publishedAt))
    .limit(opts.limit ?? 60);
  if (rows.length === 0) return [];
  const covers = await db
    .selectDistinctOn([media.projectId], { projectId: media.projectId, ...imageColumns })
    .from(media)
    .where(inArray(media.projectId, rows.map((r) => r.id)))
    .orderBy(media.projectId, asc(media.sortOrder), asc(media.createdAt));
  const byId = new Map(covers.map(({ projectId, ...img }) => [projectId, img]));
  return rows.map((r) => ({ ...r, cover: byId.get(r.id) ?? null }));
}

export type ProjectCardData = Awaited<ReturnType<typeof getPublishedProjects>>[number];

export async function getProjectBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("projects");
  const [row] = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      reference: projects.reference,
      title: projects.title,
      type: projects.type,
      stage: projects.stage,
      completionYear: projects.completionYear,
      summary: projects.summary,
      description: projects.description,
      specifications: projects.specifications,
      localityName: localities.name,
      isSample: projects.isSample,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(localities, eq(localities.id, projects.localityId))
    .where(and(eq(projects.slug, slug), publishedProject()))
    .limit(1);
  if (!row) return null;
  const images = await db
    .select(imageColumns)
    .from(media)
    .where(eq(media.projectId, row.id))
    .orderBy(asc(media.sortOrder), asc(media.createdAt));
  return { ...row, images };
}

/* -------------------------------------------------------------- services */

export async function getPublishedServices() {
  "use cache";
  cacheLife("hours");
  cacheTag("services");
  const conds = [eq(services.status, "published")];
  if (!showSampleContent()) conds.push(eq(services.isSample, false));
  return db
    .select({ id: services.id, slug: services.slug, title: services.title, summary: services.summary, body: services.body, isSample: services.isSample })
    .from(services)
    .where(and(...conds))
    .orderBy(asc(services.sortOrder), asc(services.title));
}

/* --------------------------------------------------------------- sitemap */

export async function getSitemapEntries() {
  "use cache";
  cacheLife("hours");
  cacheTag("properties");
  cacheTag("projects");
  const [props, projs] = await Promise.all([
    db.select({ slug: properties.slug, updatedAt: properties.updatedAt }).from(properties).where(publishedProperty()),
    db.select({ slug: projects.slug, updatedAt: projects.updatedAt }).from(projects).where(publishedProject()),
  ]);
  return { properties: props, projects: projs };
}
