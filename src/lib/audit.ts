import "server-only";
import { db } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";

/** Records an admin action. Pass field names or short summaries only — never secrets or lead contact details. */
export async function audit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
): Promise<void> {
  try {
    await db.insert(auditLogs).values({ actorId, action, entityType, entityId, details });
  } catch (err) {
    // Auditing must never break the action being audited.
    console.error("audit log write failed", action, entityType, err instanceof Error ? err.message : err);
  }
}
