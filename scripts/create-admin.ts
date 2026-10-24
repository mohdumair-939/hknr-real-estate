/**
 * Bootstraps an administrator (or staff) account. There is no default account and no
 * public sign-up; this script is the only way to create the first user.
 *
 *   npm run admin:create -- --email owner@example.com --name "Owner Name" [--role staff]
 *
 * A strong random password is generated and printed once. Change it after first sign-in
 * (Admin → Account). Pass --password-stdin to supply your own via standard input instead.
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "../src/lib/auth/password";
import { connect } from "../src/lib/db/connect";
import { users } from "../src/lib/db/schema";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8").trim();
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  const role = (arg("role") ?? "admin") as "admin" | "staff";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
    throw new Error('Usage: npm run admin:create -- --email you@example.com --name "Your Name" [--role admin|staff]');
  }
  if (role !== "admin" && role !== "staff") throw new Error("--role must be admin or staff");

  const generated = !process.argv.includes("--password-stdin");
  const password = generated ? randomBytes(15).toString("base64url") : await readStdin();
  if (password.length < 12) throw new Error("Password must be at least 12 characters");

  const { db, sql } = connect(process.env.DATABASE_URL!, { max: 1 });
  try {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing) throw new Error(`A user with email ${email} already exists.`);
    await db.insert(users).values({ email, name, role, passwordHash: await hashPassword(password) });
  } finally {
    await sql.end();
  }

  console.log(`Created ${role} account for ${email}.`);
  if (generated) {
    console.log(`\nTemporary password (shown once, store it safely):\n\n  ${password}\n`);
    console.log("Sign in at /admin/login and change it under Account.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
