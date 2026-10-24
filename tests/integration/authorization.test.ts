import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { login } from "@/app/admin/actions/auth";
import { saveSettings } from "@/app/admin/actions/content";
import { createUser, deleteEnquiry, setUserActive, updateEnquiry } from "@/app/admin/actions/people";
import { createProperty, deleteProperty, setPropertyStatus } from "@/app/admin/actions/properties";
import { getCurrentUser } from "@/lib/auth/dal";
import { readSession, SESSION_COOKIE } from "@/lib/auth/session";
import { enquiries, properties, sessions, siteSettings, users } from "@/lib/db/schema";
import { cookieJar } from "../support/setup";
import { db, makeLocality, resetDb, signInAs } from "../support/db";

function form(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

beforeEach(resetDb);

describe("anonymous visitors", () => {
  it("cannot create listings", async () => {
    const loc = await makeLocality();
    const r = await createProperty({}, form({ title: "Sneaky listing title", type: "plot", localityId: loc.id }));
    expect(r.error).toMatch(/session has expired/);
    expect(await db.$count(properties)).toBe(0);
  });

  it("cannot change settings or leads", async () => {
    expect((await saveSettings({}, form({ phone: "9848012345" }))).error).toBeTruthy();
    expect(await db.$count(siteSettings)).toBe(0);
    expect((await updateEnquiry("00000000-0000-0000-0000-000000000000", {}, form({ status: "closed" }))).error).toBeTruthy();
  });

  it("are not treated as signed in with a forged cookie", async () => {
    cookieJar.set(SESSION_COOKIE, "forged-token-value");
    expect(await readSession()).toBeNull();
  });
});

describe("staff role", () => {
  it("can create a draft listing", async () => {
    await signInAs("staff");
    const loc = await makeLocality();
    await expect(
      createProperty({}, form({ title: "2 BHK apartment near the station", type: "apartment", localityId: loc.id })),
    ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/properties\//);
    const [p] = await db.select().from(properties);
    expect(p.status).toBe("draft");
    expect(p.slug).toMatch(/^2-bhk-apartment-near-the-station-hk-p-\d{4}$/);
  });

  it("cannot delete listings, change settings, delete leads or manage accounts", async () => {
    await signInAs("staff");
    const loc = await makeLocality();
    const [p] = await db.insert(properties).values({ slug: "x", title: "Listing", type: "plot", localityId: loc.id }).returning();
    expect((await deleteProperty(p.id)).error).toMatch(/permission/);
    expect(await db.$count(properties)).toBe(1);
    expect((await saveSettings({}, form({}))).error).toMatch(/permission/);
    const [e] = await db.insert(enquiries).values({ category: "buy", name: "A", phone: "919848012345" }).returning();
    expect((await deleteEnquiry(e.id)).error).toMatch(/permission/);
    expect((await createUser({}, form({ name: "X Y", email: "x@example.com", role: "admin", password: "longenoughpassword" }))).error).toMatch(/permission/);
  });
});

describe("publishing rules", () => {
  it("refuses to publish an incomplete listing", async () => {
    await signInAs("admin");
    const loc = await makeLocality();
    const [p] = await db.insert(properties).values({ slug: "x", title: "Listing", type: "plot", localityId: loc.id }).returning();
    const r = await setPropertyStatus(p.id, "published");
    expect(r.error).toMatch(/photo/);
    const [after] = await db.select().from(properties).where(eq(properties.id, p.id));
    expect(after.status).toBe("draft");
  });

  it("the database itself rejects a published listing without a price", async () => {
    const loc = await makeLocality();
    await expect(
      db.insert(properties).values({ slug: "y", title: "Listing", type: "plot", localityId: loc.id, status: "published" }),
    ).rejects.toThrow();
  });
});

describe("accounts", () => {
  it("keeps at least one active administrator", async () => {
    const admin = await signInAs("admin");
    expect((await setUserActive(admin.id, false)).error).toMatch(/own account/);
  });

  it("deactivation signs the user out everywhere", async () => {
    await signInAs("admin");
    const [staff] = await db.insert(users).values({ email: "s@example.com", name: "S", role: "staff", passwordHash: "x" }).returning();
    await db.insert(sessions).values({ id: "abc", userId: staff.id, expiresAt: new Date(Date.now() + 86_400_000) });
    expect((await setUserActive(staff.id, false)).ok).toBeTruthy();
    expect(await db.$count(sessions, eq(sessions.userId, staff.id))).toBe(0);
  });

  it("login rejects a wrong password without revealing whether the email exists", async () => {
    await signInAs("admin", "owner@example.com");
    cookieJar.clear();
    const wrong = await login({}, form({ email: "owner@example.com", password: "wrong password!" }));
    const unknown = await login({}, form({ email: "nobody@example.com", password: "wrong password!" }));
    expect(wrong.error).toBe(unknown.error);
    expect(getCurrentUser).toBeDefined();
  });

  it("login succeeds with the right password and sets a session", async () => {
    await signInAs("admin", "owner@example.com");
    cookieJar.clear();
    await expect(login({}, form({ email: "OWNER@example.com", password: "correct horse battery", next: "/admin/enquiries" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/admin\/enquiries/,
    );
    expect(cookieJar.has(SESSION_COOKIE)).toBe(true);
  });

  it("login ignores off-site redirect targets", async () => {
    await signInAs("admin", "owner@example.com");
    cookieJar.clear();
    await expect(login({}, form({ email: "owner@example.com", password: "correct horse battery", next: "https://evil.example" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/admin$/,
    );
  });
});
