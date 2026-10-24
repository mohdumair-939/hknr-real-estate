import type { Metadata } from "next";
import { createProject } from "@/app/admin/actions/content";
import { ProjectForm } from "@/components/admin/project-form";
import { AdminHeader } from "@/components/admin/ui";
import { listLocalities } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Add project" };

export default async function NewProject() {
  const localities = await listLocalities();
  return (
    <div className="max-w-3xl">
      <AdminHeader
        crumbs={[{ href: "/admin/projects", label: "Projects" }, { label: "New" }]}
        title="Add a project"
        description="Saved as a draft. Add photos on the next screen, then publish."
      />
      <ProjectForm action={createProject} localities={localities} submitLabel="Save draft and add photos" />
    </div>
  );
}
