import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, PublicationBadge } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge, EmptyState, SampleBadge } from "@/components/ui/feedback";
import { listProjects } from "@/lib/admin/queries";
import { PROJECT_STAGE_LABEL, PROJECT_TYPE_LABEL } from "@/lib/domain";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjects(props: PageProps<"/admin/projects">) {
  const [rows, sp] = await Promise.all([listProjects(), props.searchParams]);
  return (
    <>
      <AdminHeader
        title="Projects"
        description="Construction work shown in the portfolio. Publish only real projects with genuine photos."
        actions={
          <ButtonLink href="/admin/projects/new">
            <Plus aria-hidden="true" /> Add project
          </ButtonLink>
        }
      />
      {sp.deleted ? (
        <Alert tone="success" role="status" className="mb-4">
          Project deleted.
        </Alert>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title="No projects yet" action={<ButtonLink href="/admin/projects/new">Add a project</ButtonLink>}>
          Until a project is published, the website shows a short note instead of a portfolio.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
          {rows.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/projects/${p.id}`} className="grid gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-canvas md:grid-cols-[6.5rem_1fr_12rem_7rem] md:items-center">
                <span className="text-sm text-ink-muted">{p.reference}</span>
                <span className="min-w-0">
                  <span className="block font-semibold">{p.title}</span>
                  <span className="block text-sm text-ink-muted">
                    {PROJECT_TYPE_LABEL[p.type]}
                    {p.localityName ? ` · ${p.localityName}` : ""} · {p.photos} {p.photos === 1 ? "photo" : "photos"}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <PublicationBadge status={p.status} />
                  <Badge>{PROJECT_STAGE_LABEL[p.stage]}</Badge>
                  {p.isSample ? <SampleBadge /> : null}
                </span>
                <span className="text-xs text-ink-muted">Updated {formatDate(p.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
