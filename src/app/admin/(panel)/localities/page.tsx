import type { Metadata } from "next";
import { deleteLocality } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/form-bits";
import { LocalityForm } from "@/components/admin/simple-forms";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { listLocalities } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Localities" };

export default async function LocalitiesPage() {
  const rows = await listLocalities();
  return (
    <div className="max-w-3xl space-y-6">
      <AdminHeader
        title="Localities"
        description="Areas used on listings. Visitors can only filter by localities that have published listings, so adding one here doesn't show it publicly on its own."
      />
      <Panel title="Add a locality">
        <LocalityForm id={null} />
      </Panel>
      <Panel title={`${rows.length} ${rows.length === 1 ? "locality" : "localities"}`}>
        {rows.length ? (
          <ul className="-my-4 divide-y divide-line">
            {rows.map((l) => (
              <li key={l.id} className="py-4">
                <LocalityForm id={l.id} initial={l} />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                  <span>
                    Used by {l.properties} {l.properties === 1 ? "listing" : "listings"}
                  </span>
                  {l.properties === 0 ? (
                    <ActionButton
                      action={deleteLocality.bind(null, l.id)}
                      variant="ghost"
                      confirm={{ title: `Delete “${l.name}”?`, body: "This can't be undone." }}
                      confirmLabel="Delete"
                    >
                      Delete
                    </ActionButton>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted">No localities yet. Add Moula Ali and any other areas HKNR serves.</p>
        )}
      </Panel>
    </div>
  );
}
