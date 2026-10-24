import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteProject, setProjectStatus, updateProject } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/form-bits";
import { PhotoManager } from "@/components/admin/photo-manager";
import { ProjectForm } from "@/components/admin/project-form";
import { AdminHeader, Panel, PublicationBadge } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Alert, SampleBadge } from "@/components/ui/feedback";
import { getProjectForAdmin, listLocalities } from "@/lib/admin/queries";
import { requireUser } from "@/lib/auth/dal";
import { mediaUrl } from "@/lib/storage/public-url";

export const metadata: Metadata = { title: "Edit project" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function EditProject(props: PageProps<"/admin/projects/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const [me, p, localities, sp] = await Promise.all([requireUser(), getProjectForAdmin(id), listLocalities(), props.searchParams]);
  if (!p) notFound();
  const photos = p.photos.map((m) => ({
    id: m.id,
    thumb: mediaUrl(m.storageKey, m.variants[0]),
    altText: m.altText,
    caption: m.caption,
    width: m.width,
    height: m.height,
  }));

  return (
    <>
      <AdminHeader
        crumbs={[{ href: "/admin/projects", label: "Projects" }, { label: p.reference }]}
        title={p.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {p.reference} <PublicationBadge status={p.status} /> {p.isSample ? <SampleBadge /> : null}
          </span>
        }
        actions={
          p.status === "published" ? (
            <ButtonLink href={`/projects/${p.slug}`} variant="secondary" size="sm" target="_blank">
              <ExternalLink aria-hidden="true" /> View live
            </ButtonLink>
          ) : null
        }
      />
      {sp.created ? (
        <Alert tone="success" role="status" className="mb-6" title="Draft saved">
          Add photos of the actual project below, then publish.
        </Alert>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="order-2 min-w-0 space-y-6 xl:order-1">
          <Panel title="Photos" description="Only genuine photos of this project. The first photo is the cover.">
            <PhotoManager owner="project" ownerId={p.id} photos={photos} />
          </Panel>
          <ProjectForm action={updateProject.bind(null, p.id)} initial={p} localities={localities} submitLabel="Save changes" />
        </div>
        <div className="order-1 space-y-6 xl:order-2 xl:sticky xl:top-6 xl:self-start">
          <Panel title="Publishing">
            {p.status === "published" ? (
              <ActionButton
                action={setProjectStatus.bind(null, p.id, "draft")}
                confirm={{ title: "Unpublish this project?", body: "It will be hidden from the website." }}
                confirmLabel="Unpublish"
              >
                Unpublish
              </ActionButton>
            ) : (
              <ActionButton
                action={setProjectStatus.bind(null, p.id, "published")}
                variant="primary"
                size="md"
                confirm={{ title: "Publish this project?", body: "It will appear in the portfolio immediately. Make sure the photos and details are genuine." }}
                confirmLabel="Publish now"
              >
                Publish
              </ActionButton>
            )}
          </Panel>
          {me.role === "admin" ? (
            <Panel title="Delete">
              <ActionButton
                action={deleteProject.bind(null, p.id)}
                variant="danger"
                confirm={{ title: `Delete ${p.reference}?`, body: "The project and its photos will be permanently deleted." }}
                confirmLabel="Delete permanently"
              >
                Delete project
              </ActionButton>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
