import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { UserRole } from "@/lib/domain";
import { readSession, type SessionUser } from "./session";

/**
 * Data Access Layer for authorisation. Every admin page, server action and
 * route handler calls one of these. Hiding UI is never the security control.
 */
export const getCurrentUser = cache(readSession);

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export class AuthError extends Error {
  constructor(public readonly reason: "unauthenticated" | "forbidden") {
    super(reason === "unauthenticated" ? "Your session has expired. Sign in again." : "You don't have permission to do that.");
  }
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function assertUser(role?: UserRole): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthenticated");
  if (role === "admin" && user.role !== "admin") throw new AuthError("forbidden");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin?denied=1");
  return user;
}
