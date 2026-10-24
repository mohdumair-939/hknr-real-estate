"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { assertUser } from "@/lib/auth/dal";
import { hashPassword } from "@/lib/auth/password";
import { destroyUserSessions } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { enquiries, leadNotes, users } from "@/lib/db/schema";
import { USER_ROLES, type UserRole } from "@/lib/domain";
import { enquiryUpdateSchema, fieldErrors, formToObject, noteSchema, passwordSchema, userCreateSchema } from "@/lib/validation";
import { isUniqueViolation, toFormError, type FormState } from "./_shared";

/* ----------------------------------------------------------------- leads */

export async function updateEnquiry(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser();
    const parsed = enquiryUpdateSchema.safeParse(formToObject(form));
    if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const [before] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
    if (!before) return { error: "This enquiry no longer exists." };
    if (parsed.data.assignedTo) {
      const [u] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, parsed.data.assignedTo), eq(users.isActive, true)));
      if (!u) return { fieldErrors: { assignedTo: "Choose an active staff member" } };
    }
    const firstResponse =
      !before.firstRespondedAt && before.status === "new" && parsed.data.status !== "new" ? new Date() : before.firstRespondedAt;
    await db
      .update(enquiries)
      .set({
        status: parsed.data.status,
        assignedTo: parsed.data.assignedTo ?? null,
        nextFollowUpAt: parsed.data.nextFollowUpAt ?? null,
        firstRespondedAt: firstResponse,
      })
      .where(eq(enquiries.id, id));
    const changes: string[] = [];
    if (before.status !== parsed.data.status) changes.push(`status: ${before.status} → ${parsed.data.status}`);
    if ((before.assignedTo ?? null) !== (parsed.data.assignedTo ?? null)) changes.push("assignment");
    if (String(before.nextFollowUpAt ?? "") !== String(parsed.data.nextFollowUpAt ?? "")) changes.push("follow-up date");
    await audit(me.id, "enquiry.update", "enquiry", id, { changes });
    return { ok: changes.length ? "Enquiry updated." : "No changes to save." };
  } catch (err) {
    return toFormError(err, "updateEnquiry");
  }
}

export async function addLeadNote(enquiryId: string, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser();
    const parsed = noteSchema.safeParse({ body: form.get("body") });
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
    const [e] = await db.select({ id: enquiries.id }).from(enquiries).where(eq(enquiries.id, enquiryId));
    if (!e) return { error: "This enquiry no longer exists." };
    await db.insert(leadNotes).values({ enquiryId, authorId: me.id, body: parsed.data.body });
    await audit(me.id, "enquiry.note", "enquiry", enquiryId);
    return { ok: "Note added." };
  } catch (err) {
    return toFormError(err, "addLeadNote");
  }
}

/** Deleting a lead (e.g. a privacy request) is restricted to administrators. */
export async function deleteEnquiry(id: string): Promise<FormState> {
  try {
    const me = await assertUser("admin");
    const [d] = await db.delete(enquiries).where(eq(enquiries.id, id)).returning({ reference: enquiries.reference });
    if (!d) return { error: "This enquiry no longer exists." };
    await audit(me.id, "enquiry.delete", "enquiry", id, { reference: d.reference });
  } catch (err) {
    return toFormError(err, "deleteEnquiry");
  }
  redirect("/admin/enquiries?deleted=1");
}

/* ----------------------------------------------------------------- users */

export async function createUser(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser("admin");
    const parsed = userCreateSchema.safeParse(formToObject(form));
    if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const [u] = await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash: await hashPassword(parsed.data.password),
      })
      .returning({ id: users.id });
    await audit(me.id, "user.create", "user", u.id, { role: parsed.data.role });
    return { ok: `Account created for ${parsed.data.name}. Share the password with them privately and ask them to change it.` };
  } catch (err) {
    if (isUniqueViolation(err)) return { fieldErrors: { email: "An account with this email already exists" } };
    return toFormError(err, "createUser");
  }
}

async function otherActiveAdmins(excludeId: string) {
  return db.$count(users, and(eq(users.role, "admin"), eq(users.isActive, true), ne(users.id, excludeId)));
}

export async function setUserActive(id: string, active: boolean): Promise<FormState> {
  try {
    const me = await assertUser("admin");
    if (id === me.id && !active) return { error: "You can't deactivate your own account." };
    const [target] = await db.select().from(users).where(eq(users.id, id));
    if (!target) return { error: "This account no longer exists." };
    if (!active && target.role === "admin" && (await otherActiveAdmins(id)) === 0) {
      return { error: "At least one active administrator is required." };
    }
    await db.update(users).set({ isActive: active }).where(eq(users.id, id));
    if (!active) await destroyUserSessions(id);
    await audit(me.id, active ? "user.activate" : "user.deactivate", "user", id);
    return { ok: active ? "Account reactivated." : "Account deactivated and signed out everywhere." };
  } catch (err) {
    return toFormError(err, "setUserActive");
  }
}

export async function setUserRole(id: string, role: UserRole): Promise<FormState> {
  try {
    const me = await assertUser("admin");
    if (!USER_ROLES.includes(role)) return { error: "Unknown role." };
    if (id === me.id && role !== "admin") return { error: "You can't remove your own administrator role." };
    const [target] = await db.select().from(users).where(eq(users.id, id));
    if (!target) return { error: "This account no longer exists." };
    if (target.role === "admin" && role !== "admin" && (await otherActiveAdmins(id)) === 0) {
      return { error: "At least one active administrator is required." };
    }
    await db.update(users).set({ role }).where(eq(users.id, id));
    await audit(me.id, "user.role", "user", id, { role });
    return { ok: "Role updated." };
  } catch (err) {
    return toFormError(err, "setUserRole");
  }
}

export async function resetUserPassword(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    const me = await assertUser("admin");
    const pw = passwordSchema.safeParse(String(form.get("password") ?? ""));
    if (!pw.success) return { fieldErrors: { password: pw.error.issues[0]?.message } };
    const res = await db
      .update(users)
      .set({ passwordHash: await hashPassword(pw.data), passwordChangedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });
    if (!res.length) return { error: "This account no longer exists." };
    await destroyUserSessions(id);
    await audit(me.id, "user.password_reset", "user", id);
    return { ok: "Password reset. They have been signed out and must use the new password." };
  } catch (err) {
    return toFormError(err, "resetUserPassword");
  }
}
