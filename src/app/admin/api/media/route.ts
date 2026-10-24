import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { nextSortOrder } from "@/lib/admin/queries";
import { audit } from "@/lib/audit";
import { assertUser, AuthError } from "@/lib/auth/dal";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db/client";
import { media, projects, properties, siteSettings } from "@/lib/db/schema";
import { ImageError, MAX_UPLOAD_BYTES, processImage } from "@/lib/images";
import { rateLimit } from "@/lib/rate-limit";
import { storage } from "@/lib/storage";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * Uploads one photo (the browser sends files one at a time so it can show progress per file).
 * Form fields: owner = property | project | hero, id = owner uuid (not for hero), file.
 */
export async function POST(request: Request) {
  let me;
  try {
    me = await assertUser();
  } catch (err) {
    return fail(err instanceof AuthError ? err.message : "Not allowed", 401);
  }

  // Cross-site requests are rejected; the session cookie is SameSite=Lax but this is defence in depth.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return fail("Request origin not allowed.", 403);

  if (!(await rateLimit(`upload:${me.id}`, 120, 3600))) {
    return fail("Upload limit reached for this hour. Try again later.", 429);
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return fail("The photo is larger than 15 MB.", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("The upload was incomplete. Check your connection and try again.", 400);
  }
  const owner = form.get("owner");
  const ownerId = String(form.get("id") ?? "");
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("No photo was received.", 400);
  if (owner !== "hero" && (!UUID.test(ownerId) || (owner !== "property" && owner !== "project"))) {
    return fail("Unknown upload target.", 400);
  }
  if (owner === "hero" && me.role !== "admin") return fail("Only administrators can change the home page image.", 403);

  // Confirm the owner exists before doing any image work.
  if (owner === "property") {
    const [p] = await db.select({ id: properties.id }).from(properties).where(eq(properties.id, ownerId));
    if (!p) return fail("This listing no longer exists.", 404);
  } else if (owner === "project") {
    const [p] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, ownerId));
    if (!p) return fail("This project no longer exists.", 404);
  }

  let processed;
  try {
    processed = await processImage(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    if (err instanceof ImageError) return fail(err.message, 422);
    console.error("image processing failed", err instanceof Error ? err.message : err);
    return fail("The photo couldn't be processed. Try exporting it as a JPEG and uploading again.", 422);
  }

  const mediaId = randomUUID();
  const folder = owner === "hero" ? "site/hero" : owner === "property" ? `properties/${ownerId}` : `projects/${ownerId}`;
  const storageKey = `${folder}/${mediaId}`;
  try {
    for (const v of processed.variants) await storage().put(`${storageKey}/${v.width}.webp`, v.body, "image/webp");
  } catch (err) {
    console.error("storage upload failed", err instanceof Error ? err.message : err);
    await storage().deletePrefixes([storageKey]).catch(() => {});
    return fail("The photo couldn't be stored. Try again in a moment.", 502);
  }

  const variants = processed.variants.map((v) => v.width);
  if (owner === "hero") {
    const [prev] = await db.select({ hero: siteSettings.heroImage }).from(siteSettings).where(eq(siteSettings.id, 1));
    const hero = {
      storageKey,
      width: processed.width,
      height: processed.height,
      variants,
      blurDataUrl: processed.blurDataUrl,
      altText: prev?.hero?.altText ?? "",
    };
    await db.insert(siteSettings).values({ id: 1, heroImage: hero }).onConflictDoUpdate({ target: siteSettings.id, set: { heroImage: hero } });
    if (prev?.hero) await storage().deletePrefixes([prev.hero.storageKey]).catch(() => {});
    await audit(me.id, "settings.hero_uploaded", "settings", "1");
    revalidateTag(TAGS.settings, { expire: 0 });
    return Response.json({ ok: true });
  }

  const sortOrder = await nextSortOrder(owner === "property" ? { propertyId: ownerId } : { projectId: ownerId });
  await db.insert(media).values({
    id: mediaId,
    propertyId: owner === "property" ? ownerId : null,
    projectId: owner === "project" ? ownerId : null,
    storageKey,
    width: processed.width,
    height: processed.height,
    variants,
    blurDataUrl: processed.blurDataUrl,
    altText: "",
    sortOrder,
    byteSize: processed.byteSize,
    createdBy: me.id,
  });
  await audit(me.id, "media.upload", "media", mediaId, { owner });
  revalidateTag(owner === "property" ? TAGS.properties : TAGS.projects, { expire: 0 });
  return Response.json({ ok: true, id: mediaId });
}
