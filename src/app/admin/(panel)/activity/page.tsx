import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { EmptyState } from "@/components/ui/feedback";
import { listAudit } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Activity log" };

const LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.password_changed": "Changed their password",
  "property.create": "Created a listing",
  "property.update": "Edited a listing",
  "property.publish": "Published a listing",
  "property.unpublish": "Unpublished a listing",
  "property.archive": "Archived a listing",
  "property.availability": "Changed listing availability",
  "property.delete": "Deleted a listing",
  "media.upload": "Uploaded a photo",
  "media.update": "Edited a photo description",
  "media.reorder": "Reordered photos",
  "media.delete": "Deleted a photo",
  "enquiry.update": "Updated an enquiry",
  "enquiry.note": "Added a note to an enquiry",
  "enquiry.delete": "Deleted an enquiry",
  "settings.update": "Changed website settings",
};

function describe(details: Record<string, unknown>): string | null {
  if (Array.isArray(details.fields) && details.fields.length) return `Fields: ${details.fields.join(", ")}`;
  if (Array.isArray(details.changes) && details.changes.length) return details.changes.join(", ");
  if (typeof details.reference === "string") return details.reference;
  if (typeof details.title === "string") return details.title;
  return null;
}

export default async function ActivityPage() {
  await requireAdmin();
  const rows = await listAudit(200);
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Activity log" description="The last 200 administrative actions. Passwords and customer contact details are never recorded here." />
      {rows.length ? (
        <ol className="divide-y divide-line rounded-md border border-line bg-surface">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr]">
              <span className="text-sm text-ink-muted">{formatDateTime(r.createdAt)}</span>
              <span>
                <span className="font-semibold">{r.actor ?? "System / former user"}</span> {(LABELS[r.action] ?? r.action).toLowerCase()}
                {describe(r.details) ? <span className="block text-sm text-ink-muted">{describe(r.details)}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="No activity yet" />
      )}
    </div>
  );
}
