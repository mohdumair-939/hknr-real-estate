"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { findPossibleDuplicates } from "@/lib/admin/queries";
import { audit } from "@/lib/audit";
import { assertUser } from "@/lib/auth/dal";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db/client";
import { media, properties } from "@/lib/db/schema";
import { AVAILABILITIES, PUBLICATION_STATUSES, type Availability, type PublicationStatus } from "@/lib/domain";
import { slugify } from "@/lib/format";
import { storage } from "@/lib/storage";
import { fieldErrors, formToObject, propertySchema, publishProblems, type PropertyInput } from "@/lib/validation";
import { toFormError, type FormState } from "./_shared";

function toRow(d: PropertyInput) {
  return {
    title: d.title,
    type: d.type,
    transaction: d.transaction,
    localityId: d.localityId,
    description: d.description,
    priceInr: d.priceOnRequest ? null : (d.priceInr ?? null),
    priceOnRequest: d.priceOnRequest,
    priceNegotiable: d.priceNegotiable,
    locationNote: d.locationNote ?? null,
    addressPrivate: d.addressPrivate ?? null,
    plotArea: d.plotArea != null ? String(d.plotArea) : null,
    plotAreaUnit: d.plotArea != null ? (d.plotAreaUnit ?? null) : null,
    builtUpAreaSqft: d.builtUpAreaSqft != null ? String(d.builtUpAreaSqft) : null,
    carpetAreaSqft: d.carpetAreaSqft != null ? String(d.carpetAreaSqft) : null,
    bedrooms: d.bedrooms ?? null,
    bathrooms: d.bathrooms ?? null,
    facing: d.facing ?? null,
    floorNumber: d.floorNumber ?? null,
    totalFloors: d.totalFloors ?? null,
    constructionStatus: d.constructionStatus ?? null,
    approvals: d.approvals ?? null,
    reraNumber: d.reraNumber ?? null,
    features: d.features,
    availability: d.availability,
    isFeatured: d.isFeatured,
  };
}

/** Field names that changed, for the audit log (values are deliberately not recorded). */
function changedFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return Object.keys(after).filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));
}

export async function createProperty(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser();
    const parsed = propertySchema.safeParse(formToObject(form));
    if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

    if (form.get("confirmDuplicate") !== "on") {
      const dupes = await findPossibleDuplicates({
        localityId: parsed.data.localityId,
        type: parsed.data.type,
        title: parsed.data.title,
        plotArea: parsed.data.plotArea,
        builtUpAreaSqft: parsed.data.builtUpAreaSqft,
      });
      if (dupes.length) {
        return {
          error: "This looks similar to an existing listing. Check it isn't a duplicate, then confirm to save.",
          data: { duplicates: dupes },
        };
      }
    }

    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(properties)
        .values({ ...toRow(parsed.data), slug: `tmp-${crypto.randomUUID()}`, createdBy: me.id, updatedBy: me.id })
        .returning({ id: properties.id, reference: properties.reference });
      // Slug includes the reference so it is unique and stable even if the title is edited later.
      await tx
        .update(properties)
        .set({ slug: `${slugify(parsed.data.title)}-${row.reference.toLowerCase()}` })
        .where(eq(properties.id, row.id));
      return row.id;
    });
    await audit(me.id, "property.create", "property", id, { title: parsed.data.title });
    redirect(`/admin/properties/${id}?created=1`);
  } catch (err) {
    return toFormError(err, "createProperty");
  }
}

export async function updateProperty(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser();
    const parsed = propertySchema.safeParse(formToObject(form));
    if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const [before] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    if (!before) return { error: "This listing no longer exists. It may have been deleted by someone else." };

    const row = toRow(parsed.data);
    if (before.status === "published") {
      const photoCount = await db.$count(media, eq(media.propertyId, id));
      const problems = publishProblems({ ...row, photoCount });
      if (problems.length) {
        return { error: `This listing is published, so it still needs: ${problems.join(" ")} Unpublish it first to save it incomplete.` };
      }
    }
    await db.update(properties).set({ ...row, updatedBy: me.id }).where(eq(properties.id, id));
    await audit(me.id, "property.update", "property", id, { fields: changedFields(before, row) });
    updateTag(TAGS.properties);
    return { ok: before.status === "published" ? "Saved. The live listing has been updated." : "Saved as draft." };
  } catch (err) {
    return toFormError(err, "updateProperty");
  }
}

export async function setPropertyStatus(id: string, status: PublicationStatus): Promise<FormState> {
  try {
    const me = await assertUser();
    if (!PUBLICATION_STATUSES.includes(status)) return { error: "Unknown status." };
    const [p] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    if (!p) return { error: "This listing no longer exists." };
    if (status === "published") {
      const photoCount = await db.$count(media, eq(media.propertyId, id));
      const problems = publishProblems({ ...p, photoCount });
      if (problems.length) return { error: `Before publishing: ${problems.join(" ")}` };
    }
    await db
      .update(properties)
      .set({ status, updatedBy: me.id, publishedAt: status === "published" ? (p.publishedAt ?? new Date()) : p.publishedAt })
      .where(eq(properties.id, id));
    await audit(me.id, `property.${status === "published" ? "publish" : status === "draft" ? "unpublish" : "archive"}`, "property", id);
    updateTag(TAGS.properties);
    return {
      ok:
        status === "published"
          ? "Published. The listing is now live on the website."
          : status === "draft"
            ? "Unpublished. The listing is hidden from the website."
            : "Archived.",
    };
  } catch (err) {
    return toFormError(err, "setPropertyStatus");
  }
}

export async function setPropertyAvailability(id: string, value: Availability): Promise<FormState> {
  try {
    const me = await assertUser();
    if (!AVAILABILITIES.includes(value)) return { error: "Unknown availability." };
    const res = await db
      .update(properties)
      .set({ availability: value, updatedBy: me.id })
      .where(eq(properties.id, id))
      .returning({ id: properties.id });
    if (!res.length) return { error: "This listing no longer exists." };
    await audit(me.id, "property.availability", "property", id, { availability: value });
    updateTag(TAGS.properties);
    return { ok: "Availability updated." };
  } catch (err) {
    return toFormError(err, "setPropertyAvailability");
  }
}

/** Permanent deletion is limited to administrators; staff can archive instead. */
export async function deleteProperty(id: string): Promise<FormState> {
  try {
    const me = await assertUser("admin");
    const keys = await db.select({ key: media.storageKey }).from(media).where(eq(media.propertyId, id));
    const [deleted] = await db
      .delete(properties)
      .where(eq(properties.id, id))
      .returning({ reference: properties.reference, title: properties.title });
    if (!deleted) return { error: "This listing no longer exists." };
    // Files are removed after the row; an orphaned file is harmless, a dangling row is not.
    await storage()
      .deletePrefixes(keys.map((k) => k.key))
      .catch((e) => console.error("photo cleanup failed", e instanceof Error ? e.message : e));
    await audit(me.id, "property.delete", "property", id, { reference: deleted.reference });
    updateTag(TAGS.properties);
  } catch (err) {
    return toFormError(err, "deleteProperty");
  }
  redirect("/admin/properties?deleted=1");
}

/* ---------------------------------------------------------------- photos */

export async function updatePhotoDetails(mediaId: string, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser();
    const alt = String(form.get("altText") ?? "").trim().slice(0, 200);
    const caption = String(form.get("caption") ?? "").trim().slice(0, 200) || null;
    const [m] = await db
      .update(media)
      .set({ altText: alt, caption })
      .where(eq(media.id, mediaId))
      .returning({ propertyId: media.propertyId, projectId: media.projectId });
    if (!m) return { error: "This photo no longer exists." };
    await audit(me.id, "media.update", "media", mediaId);
    updateTag(m.propertyId ? TAGS.properties : TAGS.projects);
    return { ok: "Photo description saved." };
  } catch (err) {
    return toFormError(err, "updatePhotoDetails");
  }
}

export async function movePhoto(mediaId: string, direction: -1 | 1): Promise<FormState> {
  try {
    const me = await assertUser();
    const [m] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
    if (!m) return { error: "This photo no longer exists." };
    const ownerCond = m.propertyId ? eq(media.propertyId, m.propertyId) : eq(media.projectId, m.projectId!);
    const siblings = await db.select({ id: media.id }).from(media).where(ownerCond).orderBy(media.sortOrder, media.createdAt);
    const idx = siblings.findIndex((s) => s.id === mediaId);
    const target = idx + direction;
    if (target < 0 || target >= siblings.length) return {};
    const order = siblings.map((s) => s.id);
    [order[idx], order[target]] = [order[target], order[idx]];
    await db.transaction(async (tx) => {
      for (const [i, sid] of order.entries()) await tx.update(media).set({ sortOrder: i }).where(eq(media.id, sid));
    });
    await audit(me.id, "media.reorder", "media", mediaId);
    updateTag(m.propertyId ? TAGS.properties : TAGS.projects);
    return { ok: target === 0 ? "Set as the cover photo." : "Photo moved." };
  } catch (err) {
    return toFormError(err, "movePhoto");
  }
}

export async function deletePhoto(mediaId: string): Promise<FormState> {
  try {
    const me = await assertUser();
    const [m] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
    if (!m) return { error: "This photo no longer exists." };
    if (m.propertyId) {
      // A published listing must keep at least one photo.
      const [p] = await db.select({ status: properties.status }).from(properties).where(eq(properties.id, m.propertyId));
      const remaining = await db.$count(media, and(eq(media.propertyId, m.propertyId)));
      if (p?.status === "published" && remaining <= 1) {
        return { error: "A published listing needs at least one photo. Upload another photo first, or unpublish the listing." };
      }
    }
    await db.delete(media).where(eq(media.id, mediaId));
    await storage()
      .deletePrefixes([m.storageKey])
      .catch((e) => console.error("photo cleanup failed", e instanceof Error ? e.message : e));
    await audit(me.id, "media.delete", "media", mediaId);
    updateTag(m.propertyId ? TAGS.properties : TAGS.projects);
    return { ok: "Photo removed." };
  } catch (err) {
    return toFormError(err, "deletePhoto");
  }
}
