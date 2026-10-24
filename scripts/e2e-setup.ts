/**
 * Prepares the end-to-end database: migrate, wipe, then create one admin and one locality.
 * Listings are created through the UI by the tests themselves. Only runs against *_e2e databases.
 */
import path from "node:path";
import { rm } from "node:fs/promises";
import { sql as dsql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { hashPassword } from "../src/lib/auth/password";
import { connect } from "../src/lib/db/connect";
import { localities, users } from "../src/lib/db/schema";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/\/[\w-]*_e2e(\?|$)/.test(url)) throw new Error(`Refusing to prepare a non-e2e database: ${url}`);
  const { db, sql } = connect(url, { max: 1 });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await db.execute(
    dsql`TRUNCATE audit_logs, lead_notes, enquiries, media, properties, projects, services, localities, sessions, users, site_settings, rate_limits RESTART IDENTITY CASCADE`,
  );
  await rm(path.join(process.cwd(), ".data/e2e-uploads"), { recursive: true, force: true });
  await db.insert(users).values({
    email: "e2e-admin@example.com",
    name: "E2E Admin",
    role: "admin",
    passwordHash: await hashPassword(process.env.E2E_ADMIN_PASSWORD ?? "e2e-password-123"),
  });
  await db.insert(localities).values({ name: "Moula Ali", slug: "moula-ali" });
  await sql.end();
  console.log("e2e database ready");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
