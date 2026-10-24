import "server-only";
import { AuthError } from "@/lib/auth/dal";
import type { FieldErrors } from "@/lib/validation";

export type FormState = {
  ok?: string;
  error?: string;
  fieldErrors?: FieldErrors;
  /** Extra data for the client, e.g. the id of a newly created record or duplicate matches. */
  data?: Record<string, unknown>;
};

/** Converts thrown errors into user-facing messages. Internal details are logged, never returned. */
export function toFormError(err: unknown, context: string): FormState {
  if (err instanceof AuthError) return { error: err.message };
  // redirect()/notFound() use thrown control-flow errors that must propagate.
  if (err && typeof err === "object" && "digest" in err && typeof (err as { digest: unknown }).digest === "string") {
    const digest = (err as { digest: string }).digest;
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR")) throw err;
  }
  console.error(`${context} failed`, err instanceof Error ? err.message : err);
  return { error: "That didn't save because of a problem on the server. Your changes are still on the page — try again." };
}

/** Postgres unique-violation helper (code 23505). */
export function isUniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505");
}
