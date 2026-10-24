import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { localities, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { cookieJar } from "./setup";

export { db };

/** Empties every table between tests. */
export async function resetDb() {
  await db.execute(
    sql`TRUNCATE audit_logs, lead_notes, enquiries, media, properties, projects, services, localities, sessions, users, site_settings, rate_limits RESTART IDENTITY CASCADE`,
  );
  cookieJar.clear();
}

export async function makeLocality(name = "Moula Ali") {
  const [l] = await db.insert(localities).values({ name, slug: name.toLowerCase().replace(/\W+/g, "-") }).returning();
  return l;
}

/** Creates a user and signs the fake cookie jar in as them. */
export async function signInAs(role: "admin" | "staff", email = `${role}@example.com`) {
  const [u] = await db
    .insert(users)
    .values({ email, name: role === "admin" ? "Test Admin" : "Test Staff", role, passwordHash: await hashPassword("correct horse battery") })
    .returning();
  await createSession(u.id, "vitest");
  return u;
}
