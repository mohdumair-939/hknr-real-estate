import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * Best-effort client IP. Render sits behind Cloudflare, which sets cf-connecting-ip /
 * true-client-ip; otherwise fall back to the left-most X-Forwarded-For entry.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ??
    h.get("true-client-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Salted, truncated hash so raw IP addresses are never stored. */
export function hashIp(ip: string): string {
  const salt = env().IP_HASH_SALT ?? "development-only-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function userAgent(): Promise<string | null> {
  return (await headers()).get("user-agent");
}
