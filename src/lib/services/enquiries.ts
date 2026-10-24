import "server-only";
import { and, eq } from "drizzle-orm";
import type { Database } from "@/lib/db/connect";
import { enquiries, projects, properties, siteSettings } from "@/lib/db/schema";
import { CONTACT_METHOD_LABEL, ENQUIRY_CATEGORY_LABEL } from "@/lib/domain";
import type { SendResult } from "@/lib/email";
import { formatPhoneDisplay } from "@/lib/format";
import { CONSENT_VERSION, type EnquiryInput } from "@/lib/validation";

export type EnquiryMeta = { ipHash: string | null; suspectedSpam: boolean };

/**
 * Persists an enquiry. Linked property/project ids are verified to be published;
 * an unknown id is dropped rather than failing the visitor's submission.
 * The record is committed before any notification is attempted.
 */
export async function saveEnquiry(db: Database, input: EnquiryInput, meta: EnquiryMeta) {
  let propertyId: string | null = null;
  let projectId: string | null = null;
  let subject: string | null = null;

  if (input.propertyId) {
    const [p] = await db
      .select({ id: properties.id, reference: properties.reference, title: properties.title })
      .from(properties)
      .where(and(eq(properties.id, input.propertyId), eq(properties.status, "published")))
      .limit(1);
    if (p) {
      propertyId = p.id;
      subject = `${p.reference} — ${p.title}`;
    }
  }
  if (input.projectId) {
    const [p] = await db
      .select({ id: projects.id, reference: projects.reference, title: projects.title })
      .from(projects)
      .where(and(eq(projects.id, input.projectId), eq(projects.status, "published")))
      .limit(1);
    if (p) {
      projectId = p.id;
      subject = `${p.reference} — ${p.title}`;
    }
  }

  const [row] = await db
    .insert(enquiries)
    .values({
      category: input.category,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      preferredContact: input.preferredContact,
      message: input.message,
      propertyId,
      projectId,
      subjectSnapshot: subject,
      sourcePath: input.sourcePath ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      consent: input.consent,
      consentVersion: CONSENT_VERSION,
      status: meta.suspectedSpam ? "spam" : "new",
      notificationStatus: meta.suspectedSpam ? "skipped" : "pending",
      ipHash: meta.ipHash,
    })
    .returning({ id: enquiries.id, reference: enquiries.reference, createdAt: enquiries.createdAt });

  return { ...row, subject };
}

/**
 * Sends the internal notification for a saved enquiry and records the outcome.
 * Failure only updates notification_status; the enquiry itself is never touched.
 */
export async function notifyNewEnquiry(
  db: Database,
  enquiryId: string,
  send: (msg: { to: string; subject: string; text: string; replyTo?: string }) => Promise<SendResult>,
  adminUrl: string,
): Promise<SendResult> {
  const [e] = await db.select().from(enquiries).where(eq(enquiries.id, enquiryId)).limit(1);
  if (!e) return { status: "skipped", reason: "Enquiry not found" };
  const [settings] = await db
    .select({ to: siteSettings.notificationEmail })
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);

  let result: SendResult;
  if (!settings?.to) {
    result = { status: "skipped", reason: "No notification email set in admin settings" };
  } else {
    // Contact details are deliberately left out of the email body; staff open the lead in admin.
    const lines = [
      `New enquiry ${e.reference}`,
      ``,
      `Category: ${ENQUIRY_CATEGORY_LABEL[e.category]}`,
      e.subjectSnapshot ? `About: ${e.subjectSnapshot}` : null,
      `Name: ${e.name}`,
      `Prefers: ${CONTACT_METHOD_LABEL[e.preferredContact]}`,
      e.phone ? `Phone: ${formatPhoneDisplay(e.phone)}` : null,
      ``,
      `Open in admin: ${adminUrl}/admin/enquiries/${e.id}`,
    ].filter((l): l is string => l !== null);
    result = await send({
      to: settings.to,
      subject: `New enquiry ${e.reference} — ${ENQUIRY_CATEGORY_LABEL[e.category]}`,
      text: lines.join("\n"),
      replyTo: e.email ?? undefined,
    });
  }

  await db
    .update(enquiries)
    .set({
      notificationStatus: result.status,
      notificationError: result.status === "failed" ? result.error : result.status === "skipped" ? result.reason : null,
    })
    .where(eq(enquiries.id, enquiryId));
  return result;
}
