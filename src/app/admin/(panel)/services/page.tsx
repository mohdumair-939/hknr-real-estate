import type { Metadata } from "next";
import { deleteService } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/form-bits";
import { ServiceForm } from "@/components/admin/simple-forms";
import { AdminHeader, Panel, PublicationBadge } from "@/components/admin/ui";
import { SampleBadge } from "@/components/ui/feedback";
import { listServices } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Construction services" };

export default async function ServicesPage() {
  const rows = await listServices();
  return (
    <div className="max-w-4xl space-y-6">
      <AdminHeader
        title="Construction services"
        description="Shown on the Construction page and the home page. Publish only services HKNR actually offers."
      />
      <Panel title="Add a service">
        <ServiceForm id={null} />
      </Panel>
      {rows.map((s) => (
        <Panel
          key={s.id}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {s.title} <PublicationBadge status={s.status} /> {s.isSample ? <SampleBadge /> : null}
            </span>
          }
          actions={
            <ActionButton
              action={deleteService.bind(null, s.id)}
              variant="ghost"
              confirm={{ title: `Delete “${s.title}”?`, body: "It will be removed from the website." }}
              confirmLabel="Delete"
            >
              Delete
            </ActionButton>
          }
        >
          <ServiceForm id={s.id} initial={s} />
        </Panel>
      ))}
    </div>
  );
}
