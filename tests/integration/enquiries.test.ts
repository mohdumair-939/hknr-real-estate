import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { submitEnquiry, type EnquiryState } from "@/app/actions/enquiry";
import { enquiries, properties, siteSettings } from "@/lib/db/schema";
import { notifyNewEnquiry, saveEnquiry } from "@/lib/services/enquiries";
import { enquirySchema } from "@/lib/validation";
import { db, makeLocality, resetDb } from "../support/db";

function form(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

const valid = {
  category: "buy",
  name: "Asha Reddy",
  phone: "98480 12345",
  consent: "on",
  message: "Looking for a 2 BHK",
  startedAt: String(Date.now() - 10_000),
};

beforeEach(resetDb);

describe("enquiry submission", () => {
  it("saves a valid enquiry and returns its reference", async () => {
    const r = await submitEnquiry({ status: "idle" }, form(valid));
    expect(r.status).toBe("success");
    const rows = await db.select().from(enquiries);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Asha Reddy", phone: "919848012345", status: "new", consent: true });
    expect(rows[0].reference).toBe((r as Extract<EnquiryState, { status: "success" }>).reference);
    expect(rows[0].ipHash).toMatch(/^[0-9a-f]{32}$/);
  });

  it("rejects invalid input, saves nothing and echoes the typed values back", async () => {
    const r = await submitEnquiry({ status: "idle" }, form({ ...valid, phone: "123", name: "Asha" }));
    expect(r.status).toBe("error");
    if (r.status !== "error") return;
    expect(r.fieldErrors?.phone).toBeTruthy();
    expect(r.values.name).toBe("Asha");
    expect(await db.$count(enquiries)).toBe(0);
  });

  it("keeps bot submissions as spam instead of discarding them", async () => {
    const r = await submitEnquiry({ status: "idle" }, form({ ...valid, company_website: "http://spam.example" }));
    expect(r.status).toBe("success");
    const [row] = await db.select().from(enquiries);
    expect(row.status).toBe("spam");
    expect(row.notificationStatus).toBe("skipped");
  });

  it("rate-limits repeated submissions from one address", async () => {
    for (let i = 0; i < 5; i++) expect((await submitEnquiry({ status: "idle" }, form(valid))).status).toBe("success");
    const sixth = await submitEnquiry({ status: "idle" }, form(valid));
    expect(sixth.status).toBe("error");
    expect(await db.$count(enquiries)).toBe(5);
  });

  it("drops a link to an unpublished property but keeps the enquiry", async () => {
    const loc = await makeLocality();
    const [draft] = await db
      .insert(properties)
      .values({ slug: "draft-1", title: "Draft listing", type: "plot", localityId: loc.id, status: "draft" })
      .returning();
    const r = await submitEnquiry({ status: "idle" }, form({ ...valid, propertyId: draft.id }));
    expect(r.status).toBe("success");
    const [row] = await db.select().from(enquiries);
    expect(row.propertyId).toBeNull();
  });
});

describe("notification failure never loses an enquiry", () => {
  it("records a failed email and keeps the enquiry intact", async () => {
    await db.insert(siteSettings).values({ id: 1, notificationEmail: "office@example.com" });
    const input = enquirySchema.parse({ category: "sell", name: "Ravi", phone: "9848012345", consent: "on" });
    const saved = await saveEnquiry(db, input, { ipHash: null, suspectedSpam: false });

    const result = await notifyNewEnquiry(db, saved.id, async () => ({ status: "failed", error: "SMTP down" }), "http://localhost");
    expect(result.status).toBe("failed");

    const [row] = await db.select().from(enquiries).where(eq(enquiries.id, saved.id));
    expect(row).toMatchObject({ name: "Ravi", status: "new", notificationStatus: "failed", notificationError: "SMTP down" });
  });

  it("survives a sender that throws", async () => {
    await db.insert(siteSettings).values({ id: 1, notificationEmail: "office@example.com" });
    const input = enquirySchema.parse({ category: "buy", name: "Ravi", phone: "9848012345", consent: "on" });
    const saved = await saveEnquiry(db, input, { ipHash: null, suspectedSpam: false });
    await expect(
      notifyNewEnquiry(db, saved.id, async () => {
        throw new Error("boom");
      }, "http://localhost"),
    ).rejects.toThrow("boom");
    expect(await db.$count(enquiries, eq(enquiries.id, saved.id))).toBe(1);
  });

  it("skips (and says why) when no notification email is configured", async () => {
    const input = enquirySchema.parse({ category: "buy", name: "Ravi", phone: "9848012345", consent: "on" });
    const saved = await saveEnquiry(db, input, { ipHash: null, suspectedSpam: false });
    const sent: unknown[] = [];
    const r = await notifyNewEnquiry(db, saved.id, async (m) => (sent.push(m), { status: "sent" }), "http://localhost");
    expect(r.status).toBe("skipped");
    expect(sent).toHaveLength(0);
  });

  it("does not put contact details in the email body", async () => {
    await db.insert(siteSettings).values({ id: 1, notificationEmail: "office@example.com" });
    const input = enquirySchema.parse({ category: "buy", name: "Ravi", phone: "9848012345", email: "ravi@example.com", consent: "on", message: "private message text" });
    const saved = await saveEnquiry(db, input, { ipHash: null, suspectedSpam: false });
    let body = "";
    await notifyNewEnquiry(db, saved.id, async (m) => ((body = m.text), { status: "sent" }), "http://localhost");
    expect(body).not.toContain("private message text");
    expect(body).not.toContain("ravi@example.com");
    expect(body).toContain(`/admin/enquiries/${saved.id}`);
  });
});
