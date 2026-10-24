"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { assertUser } from "@/lib/auth/dal";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, destroyUserSessions } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashIp, userAgent } from "@/lib/request";
import { fieldErrors, loginSchema, passwordSchema, type FieldErrors } from "@/lib/validation";
import type { FormState } from "./_shared";

export type LoginState = { error?: string; fieldErrors?: FieldErrors; email?: string };

/** Only same-site admin paths are accepted as a post-login destination. */
function safeNext(raw: FormDataEntryValue | null): string {
  const v = typeof raw === "string" ? raw : "";
  return /^\/admin(\/[a-z0-9/_-]*)?$/i.test(v) ? v : "/admin";
}

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  const email = typeof form.get("email") === "string" ? String(form.get("email")) : "";
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), email };

  const ipHash = hashIp(await clientIp());
  const allowed =
    (await rateLimit(`login:ip:${ipHash}`, 10, 900)) && (await rateLimit(`login:email:${parsed.data.email}`, 8, 900));
  if (!allowed) {
    return { error: "Too many sign-in attempts. Wait 15 minutes and try again.", email };
  }

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  // Always run a hash comparison so response time doesn't reveal whether the email exists.
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.isActive) {
    return { error: "Email or password is incorrect.", email };
  }

  await createSession(user.id, await userAgent());
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await audit(user.id, "auth.login", "user", user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login?signedOut=1");
}

export type PasswordState = FormState;

export async function changePassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const me = await assertUser();
  const current = String(form.get("current") ?? "");
  const next = passwordSchema.safeParse(String(form.get("next") ?? ""));
  if (!next.success) return { fieldErrors: { next: next.error.issues[0]?.message } };
  if (form.get("next") !== form.get("confirm")) return { fieldErrors: { confirm: "The two new passwords don't match" } };

  const [user] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return { fieldErrors: { current: "Current password is incorrect" } };
  }
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next.data), passwordChangedAt: new Date() })
    .where(eq(users.id, me.id));
  // Sign out every other device, then start a fresh session here.
  await destroyUserSessions(me.id);
  await createSession(me.id, await userAgent());
  await audit(me.id, "auth.password_changed", "user", me.id);
  return { ok: "Password changed. Other devices have been signed out." };
}
