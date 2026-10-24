"use server";

import { after } from "next/server";
import { db } from "@/lib/db/client";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashIp } from "@/lib/request";
import { notifyNewEnquiry, saveEnquiry } from "@/lib/services/enquiries";
import { siteUrl } from "@/lib/site";
import { enquirySchema, fieldErrors, formToObject, type FieldErrors } from "@/lib/validation";

export type EnquiryState =
  | { status: "idle" }
  | { status: "success"; reference: string }
  | { status: "error"; message: string; fieldErrors?: FieldErrors; values: Record<string, string> };

const MIN_FILL_MS = 2500;

export async function submitEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  const raw = formToObject(form);
  // Echo back what the visitor typed so nothing is lost on error (strings only, no hidden internals).
  const values: Record<string, string> = {};
  for (const k of ["category", "name", "phone", "email", "preferredContact", "message", "consent"]) {
    const v = raw[k];
    if (typeof v === "string") values[k] = v;
  }

  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
      values,
    };
  }

  const ipHash = hashIp(await clientIp());
  let allowed = true;
  try {
    allowed = (await rateLimit(`enquiry:10m:${ipHash}`, 5, 600)) && (await rateLimit(`enquiry:1d:${ipHash}`, 20, 86_400));
  } catch (err) {
    // Fail open: if the limiter's table is unreachable, the save below reports the real problem.
    console.error("rate limit check failed", err instanceof Error ? err.message : err);
  }
  if (!allowed) {
    return {
      status: "error",
      message: "We've received several enquiries from this connection in a short time. Please wait a few minutes and try again, or contact us by phone.",
      values,
    };
  }

  // Bots fill hidden fields and submit instantly. Their submissions are kept but marked spam,
  // so a misjudged real enquiry can still be recovered from the admin inbox.
  const startedAt = Number(raw.startedAt);
  const suspectedSpam =
    (typeof raw.company_website === "string" && raw.company_website.trim() !== "") ||
    (Number.isFinite(startedAt) && Date.now() - startedAt < MIN_FILL_MS);

  let saved;
  try {
    saved = await saveEnquiry(db, parsed.data, { ipHash, suspectedSpam });
  } catch (err) {
    console.error("enquiry save failed", err instanceof Error ? err.message : err);
    return {
      status: "error",
      message: "We couldn't save your enquiry because of a problem on our side. Your details are still in the form — please try again in a moment.",
      values,
    };
  }

  if (!suspectedSpam) {
    // Runs after the response is sent; its outcome is recorded on the enquiry and never affects it.
    after(async () => {
      try {
        await notifyNewEnquiry(db, saved.id, sendEmail, siteUrl());
      } catch (err) {
        console.error("enquiry notification failed", err instanceof Error ? err.message : err);
      }
    });
  }

  return { status: "success", reference: saved.reference };
}
