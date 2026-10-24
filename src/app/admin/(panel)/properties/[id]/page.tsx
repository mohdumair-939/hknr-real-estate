import { Eye, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteProperty,
  setPropertyAvailability,
  setPropertyStatus,
  updateProperty,
} from "@/app/admin/actions/properties";
import { ActionButton } from "@/components/admin/form-bits";
import { PhotoManager } from "@/components/admin/photo-manager";
import { PropertyForm } from "@/components/admin/property-form";
import { AdminHeader, AvailabilityBadge, Panel, PublicationBadge } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Alert, SampleBadge } from "@/components/ui/feedback";
import { getPropertyForAdmin, listLocalities } from "@/lib/admin/queries";
import { requireUser } from "@/lib/auth/dal";
import { AVAILABILITIES, AVAILABILITY_LABEL } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";
import { mediaUrl } from "@/lib/storage/public-url";
import { publishProblems } from "@/lib/validation";

export const metadata: Metadata = { title: "Edit property" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function EditProperty(props: PageProps<"/admin/properties/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const [me, p, localities, sp] = await Promise.all([requireUser(), getPropertyForAdmin(id), listLocalities(), props.searchParams]);
  if (!p) notFound();

  const problems = publishProblems({ ...p, photoCount: p.photos.length });
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
        crumbs={[{ href: "/admin/properties", label: "Properties" }, { label: p.reference }]}
        title={p.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {p.reference} <PublicationBadge status={p.status} /> <AvailabilityBadge value={p.availability} />
            {p.isSample ? <SampleBadge /> : null}
            <span className="text-sm">Last updated {formatDateTime(p.updatedAt)}</span>
          </span>
        }
        actions={
          <>
            <ButtonLink href={`/admin/preview/property/${p.id}`} variant="secondary" size="sm" target="_blank">
              <Eye aria-hidden="true" /> Preview<span className="sr-only"> (opens in a new tab)</span>
            </ButtonLink>
            {p.status === "published" ? (
              <ButtonLink href={`/properties/${p.slug}`} variant="secondary" size="sm" target="_blank">
                <ExternalLink aria-hidden="true" /> View live<span className="sr-only"> (opens in a new tab)</span>
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {sp.created ? (
        <Alert tone="success" role="status" className="mb-6" title="Draft saved">
          Now add photos below. When everything looks right, use Publish.
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="order-2 min-w-0 space-y-6 xl:order-1">
          <Panel title="Photos" description="The first photo is the cover. Use the arrows to change the order.">
            <PhotoManager owner="property" ownerId={p.id} photos={photos} />
          </Panel>
          <PropertyForm
            action={updateProperty.bind(null, p.id)}
            initial={p}
            localities={localities}
            submitLabel="Save changes"
            cancelHref="/admin/properties"
          />
        </div>

        <div className="order-1 space-y-6 xl:order-2 xl:sticky xl:top-6 xl:self-start">
          <Panel title="Publishing">
            {p.status === "published" ? (
              <div className="space-y-3">
                <p className="text-sm">This listing is live on the website.</p>
                <ActionButton
                  action={setPropertyStatus.bind(null, p.id, "draft")}
                  confirm={{ title: "Unpublish this listing?", body: "It will disappear from the website until you publish it again." }}
                  confirmLabel="Unpublish"
                >
                  Unpublish
                </ActionButton>
              </div>
            ) : (
              <div className="space-y-3">
                {problems.length ? (
                  <Alert tone="warning" title="Needed before publishing">
                    <ul className="list-disc pl-4">
                      {problems.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </Alert>
                ) : (
                  <p className="text-sm">Ready to publish. Check the preview first.</p>
                )}
                <ActionButton
                  action={setPropertyStatus.bind(null, p.id, "published")}
                  variant="primary"
                  size="md"
                  confirm={{
                    title: "Publish this listing?",
                    body: "It will appear on the website immediately. Check that the price, measurements and photos are correct.",
                  }}
                  confirmLabel="Publish now"
                >
                  Publish
                </ActionButton>
              </div>
            )}
          </Panel>

          <Panel title="Availability" description="Quick update without editing the whole listing.">
            <div className="flex flex-wrap gap-2">
              {AVAILABILITIES.filter((a) => a !== p.availability).map((a) => (
                <ActionButton key={a} action={setPropertyAvailability.bind(null, p.id, a)} variant="ghost">
                  Mark {AVAILABILITY_LABEL[a].toLowerCase()}
                </ActionButton>
              ))}
            </div>
          </Panel>

          <Panel title="Remove">
            <div className="flex flex-col items-start gap-3">
              {p.status !== "archived" ? (
                <ActionButton
                  action={setPropertyStatus.bind(null, p.id, "archived")}
                  confirm={{ title: "Archive this listing?", body: "It will be hidden from the website and from the default list. You can restore it later." }}
                  confirmLabel="Archive"
                >
                  Archive
                </ActionButton>
              ) : (
                <ActionButton action={setPropertyStatus.bind(null, p.id, "draft")}>Restore as draft</ActionButton>
              )}
              {me.role === "admin" ? (
                <ActionButton
                  action={deleteProperty.bind(null, p.id)}
                  variant="danger"
                  confirm={{
                    title: `Delete ${p.reference} permanently?`,
                    body: "The listing and all its photos will be deleted. Enquiries about it are kept. This can't be undone.",
                  }}
                  confirmLabel="Delete permanently"
                >
                  Delete permanently
                </ActionButton>
              ) : (
                <p className="text-sm text-ink-muted">Only administrators can delete listings permanently.</p>
              )}
            </div>
          </Panel>
          <p className="px-1 text-sm text-ink-muted">
            Enquiries about this property appear in{" "}
            <Link href={`/admin/enquiries?q=${p.reference}&status=all`} className="underline">
              Enquiries
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
