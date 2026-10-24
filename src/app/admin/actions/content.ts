"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { assertUser } from "@/lib/auth/dal";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db/client";
import { localities, media, projects, properties, services, siteSettings } from "@/lib/db/schema";
import { PUBLICATION_STATUSES, type PublicationStatus } from "@/lib/domain";
import { slugify } from "@/lib/format";
import { storage } from "@/lib/storage";
import { fieldErrors, formToObject, localitySchema, projectSchema, serviceSchema, settingsSchema } from "@/lib/validation";
import { isUniqueViolation, toFormError, type FormState } from "./_shared";

/* -------------------------------------------------------------- projects */

export async function createProject(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser();
    const parsed = projectSchema.safeParse(formToObject(form));
    if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(projects)
        .values({
          ...parsed.data,
          localityId: parsed.data.localityId ?? null,
          completionYear: parsed.data.completionYear ?? null,
          slug: `tmp-${crypto.randomUUID()}`,
          createdBy: me.id,
          updatedBy: me.id,
        })
        .returning({ id: projects.id, reference: projects.reference });
      await tx
        .update(projects)
        .set({ slug: `${slugify(parsed.data.title)}-${row.reference.toLowerCase()}` })
        .where(eq(projects.id, row.id));
      return row.id;
    });
    await audit(me.id, "project.create", "project", id, { title: parsed.data.title });
    redirect(`/admin/projects/${id}?created=1`);
  } catch (err) {
    return toFormError(err, "createProject");
  }
}

export async function updateProject(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser();
    const parsed = projectSchema.safeParse(formToObject(form));
    if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const res = await db
      .update(projects)
      .set({
        ...parsed.data,
        localityId: parsed.data.localityId ?? null,
        completionYear: parsed.data.completionYear ?? null,
        updatedBy: me.id,
      })
      .where(eq(projects.id, id))
      .returning({ status: projects.status });
    if (!res.length) return { error: "This project no longer exists." };
    await audit(me.id, "project.update", "project", id);
    updateTag(TAGS.projects);
    return { ok: res[0].status === "published" ? "Saved. The live project page has been updated." : "Saved as draft." };
  } catch (err) {
    return toFormError(err, "updateProject");
  }
}

export async function setProjectStatus(id: string, status: PublicationStatus): Promise<FormState> {
  try {
    const me = await assertUser();
    if (!PUBLICATION_STATUSES.includes(status)) return { error: "Unknown status." };
    const [p] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!p) return { error: "This project no longer exists." };
    if (status === "published") {
      const photos = await db.$count(media, eq(media.projectId, id));
      const problems = [
        photos < 1 ? "Add at least one photo of the actual project." : null,
        p.summary.trim().length < 20 ? "Write a summary of at least 20 characters." : null,
      ].filter(Boolean);
      if (problems.length) return { error: `Before publishing: ${problems.join(" ")}` };
    }
    await db
      .update(projects)
      .set({ status, updatedBy: me.id, publishedAt: status === "published" ? (p.publishedAt ?? new Date()) : p.publishedAt })
      .where(eq(projects.id, id));
    await audit(me.id, `project.${status}`, "project", id);
    updateTag(TAGS.projects);
    return { ok: status === "published" ? "Published." : status === "draft" ? "Unpublished." : "Archived." };
  } catch (err) {
    return toFormError(err, "setProjectStatus");
  }
}

export async function deleteProject(id: string): Promise<FormState> {
  try {
    const me = await assertUser("admin");
    const keys = await db.select({ key: media.storageKey }).from(media).where(eq(media.projectId, id));
    const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning({ reference: projects.reference });
    if (!deleted) return { error: "This project no longer exists." };
    await storage()
      .deletePrefixes(keys.map((k) => k.key))
      .catch((e) => console.error("photo cleanup failed", e instanceof Error ? e.message : e));
    await audit(me.id, "project.delete", "project", id, { reference: deleted.reference });
    updateTag(TAGS.projects);
  } catch (err) {
    return toFormError(err, "deleteProject");
  }
  redirect("/admin/projects?deleted=1");
}

/* -------------------------------------------------------------- services */

export async function saveService(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser();
    const parsed = serviceSchema.safeParse(formToObject(form));
    if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    if (id) {
      const res = await db.update(services).set(parsed.data).where(eq(services.id, id)).returning({ id: services.id });
      if (!res.length) return { error: "This service no longer exists." };
      await audit(me.id, "service.update", "service", id);
    } else {
      const [row] = await db
        .insert(services)
        .values({ ...parsed.data, slug: `${slugify(parsed.data.title)}-${crypto.randomUUID().slice(0, 6)}` })
        .returning({ id: services.id });
      await audit(me.id, "service.create", "service", row.id);
    }
    updateTag(TAGS.services);
    return { ok: id ? "Service saved." : "Service added." };
  } catch (err) {
    return toFormError(err, "saveService");
  }
}

export async function deleteService(id: string): Promise<FormState> {
  try {
    const me = await assertUser();
    await db.delete(services).where(eq(services.id, id));
    await audit(me.id, "service.delete", "service", id);
    updateTag(TAGS.services);
    return { ok: "Service deleted." };
  } catch (err) {
    return toFormError(err, "deleteService");
  }
}

/* ------------------------------------------------------------ localities */

export async function saveLocality(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser();
    const parsed = localitySchema.safeParse(formToObject(form));
    if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const values = { name: parsed.data.name, slug: slugify(parsed.data.name), sortOrder: parsed.data.sortOrder };
    if (!values.slug) return { fieldErrors: { name: "Use letters or numbers in the name" } };
    if (id) {
      await db.update(localities).set(values).where(eq(localities.id, id));
      await audit(me.id, "locality.update", "locality", id, { name: values.name });
    } else {
      const [row] = await db.insert(localities).values(values).returning({ id: localities.id });
      await audit(me.id, "locality.create", "locality", row.id, { name: values.name });
    }
    updateTag(TAGS.localities);
    updateTag(TAGS.properties);
    return { ok: id ? "Locality saved." : "Locality added." };
  } catch (err) {
    if (isUniqueViolation(err)) return { fieldErrors: { name: "A locality with this name already exists" } };
    return toFormError(err, "saveLocality");
  }
}

export async function deleteLocality(id: string): Promise<FormState> {
  try {
    const me = await assertUser();
    const inUse =
      (await db.$count(properties, eq(properties.localityId, id))) + (await db.$count(projects, eq(projects.localityId, id)));
    if (inUse) return { error: `This locality is used by ${inUse} listing(s) or project(s). Move them to another locality first.` };
    await db.delete(localities).where(eq(localities.id, id));
    await audit(me.id, "locality.delete", "locality", id);
    updateTag(TAGS.localities);
    return { ok: "Locality deleted." };
  } catch (err) {
    return toFormError(err, "deleteLocality");
  }
}

/* -------------------------------------------------------------- settings */

export async function saveSettings(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser("admin");
    const parsed = settingsSchema.safeParse(formToObject(form));
    if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const d = parsed.data;
    const values = {
      legalName: d.legalName ?? null,
      phone: d.phone ?? null,
      whatsapp: d.whatsapp ?? null,
      email: d.email ?? null,
      notificationEmail: d.notificationEmail ?? null,
      addressLine: d.addressLine ?? null,
      showAddress: d.showAddress,
      openingHours: d.openingHours ?? null,
      mapUrl: d.mapUrl ?? null,
      socials: { instagram: d.instagram, facebook: d.facebook, youtube: d.youtube, googleBusiness: d.googleBusiness },
      aboutText: d.aboutText ?? null,
      registrationsText: d.registrationsText ?? null,
      updatedBy: me.id,
      updatedAt: new Date(),
    };
    await db.insert(siteSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: siteSettings.id, set: values });
    await audit(me.id, "settings.update", "settings", "1", {
      fields: Object.entries(values)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k]) => k),
    });
    updateTag(TAGS.settings);
    return { ok: "Settings saved. The website now shows these details." };
  } catch (err) {
    return toFormError(err, "saveSettings");
  }
}

export async function removeHeroImage(): Promise<FormState> {
  try {
    const me = await assertUser("admin");
    const [row] = await db.select({ hero: siteSettings.heroImage }).from(siteSettings).where(eq(siteSettings.id, 1));
    if (row?.hero) {
      await db.update(siteSettings).set({ heroImage: null }).where(eq(siteSettings.id, 1));
      await storage()
        .deletePrefixes([row.hero.storageKey])
        .catch(() => {});
    }
    await audit(me.id, "settings.hero_removed", "settings", "1");
    updateTag(TAGS.settings);
    return { ok: "Hero image removed. The home page shows the drawn illustration instead." };
  } catch (err) {
    return toFormError(err, "removeHeroImage");
  }
}

export async function saveHeroAlt(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser("admin");
    const [row] = await db.select({ hero: siteSettings.heroImage }).from(siteSettings).where(eq(siteSettings.id, 1));
    if (!row?.hero) return { error: "Upload a hero image first." };
    const altText = String(form.get("altText") ?? "").trim().slice(0, 200);
    await db.update(siteSettings).set({ heroImage: { ...row.hero, altText } }).where(eq(siteSettings.id, 1));
    await audit(me.id, "settings.hero_alt", "settings", "1");
    updateTag(TAGS.settings);
    return { ok: "Description saved." };
  } catch (err) {
    return toFormError(err, "saveHeroAlt");
  }
}
