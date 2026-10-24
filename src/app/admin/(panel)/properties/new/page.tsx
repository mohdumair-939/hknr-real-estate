import type { Metadata } from "next";
import { createProperty } from "@/app/admin/actions/properties";
import { PropertyForm } from "@/components/admin/property-form";
import { AdminHeader } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { listLocalities } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Add property" };

export default async function NewProperty() {
  const localities = await listLocalities();
  return (
    <div className="max-w-4xl">
      <AdminHeader
        crumbs={[{ href: "/admin/properties", label: "Properties" }, { label: "New" }]}
        title="Add a property"
        description="Saved as a draft. You'll add photos on the next screen, then publish when it's ready."
      />
      {localities.length === 0 ? (
        <EmptyState title="Add a locality first" action={<ButtonLink href="/admin/localities">Manage localities</ButtonLink>}>
          Every listing belongs to a locality (e.g. Moula Ali). Localities also drive the search filters on the website.
        </EmptyState>
      ) : (
        <PropertyForm action={createProperty} localities={localities} submitLabel="Save draft and add photos" cancelHref="/admin/properties" />
      )}
    </div>
  );
}
