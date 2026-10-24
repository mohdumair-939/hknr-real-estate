import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AvailabilityBadge, PublicationBadge } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Alert, EmptyState, SampleBadge } from "@/components/ui/feedback";
import { listProperties, propertyStatusCounts } from "@/lib/admin/queries";
import { cn } from "@/lib/cn";
import { PROPERTY_TYPE_LABEL, PUBLICATION_STATUSES, type PublicationStatus } from "@/lib/domain";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Properties" };

export default async function AdminProperties(props: PageProps<"/admin/properties">) {
  const sp = await props.searchParams;
  const status = (PUBLICATION_STATUSES as readonly string[]).includes(String(sp.status)) ? (sp.status as PublicationStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  const [rows, counts] = await Promise.all([listProperties({ status, q }), propertyStatusCounts()]);
  const tabs: { label: string; value?: PublicationStatus; n?: number }[] = [
    { label: "Active", n: (counts.published ?? 0) + (counts.draft ?? 0) },
    { label: "Published", value: "published", n: counts.published ?? 0 },
    { label: "Drafts", value: "draft", n: counts.draft ?? 0 },
    { label: "Archived", value: "archived", n: counts.archived ?? 0 },
  ];

  return (
    <>
      <AdminHeader
        title="Properties"
        description="Listings shown on the website. Only published listings are visible to visitors."
        actions={
          <ButtonLink href="/admin/properties/new">
            <Plus aria-hidden="true" /> Add property
          </ButtonLink>
        }
      />
      {sp.deleted ? (
        <Alert tone="success" role="status" className="mb-4">
          Listing deleted.
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by status" className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={`/admin/properties${t.value ? `?status=${t.value}` : ""}`}
              aria-current={status === t.value ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold whitespace-nowrap",
                status === t.value ? "bg-charcoal text-ivory" : "text-ink-muted hover:bg-sunken",
              )}
            >
              {t.label} <span className="opacity-70">{t.n}</span>
            </Link>
          ))}
        </nav>
        <form role="search" className="flex gap-2 lg:w-96">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="pq" className="sr-only">
            Search listings
          </label>
          <Input id="pq" name="q" type="search" defaultValue={q} placeholder="Title, reference or locality" className="min-h-10" />
          <Button type="submit" variant="secondary" size="sm" className="min-h-10">
            <Search aria-hidden="true" />
            <span className="sr-only">Search</span>
          </Button>
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={q ? "No listings match your search" : "No listings here yet"}
          action={<ButtonLink href="/admin/properties/new">Add the first property</ButtonLink>}
        >
          {q ? "Try a different word or reference." : "Add a property, upload its photos and publish it when it's ready."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
          {rows.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/properties/${p.id}`}
                className="grid gap-x-4 gap-y-1.5 px-4 py-3.5 hover:bg-canvas md:grid-cols-[6.5rem_1fr_8rem_9rem_7rem] md:items-center"
              >
                <span className="text-sm text-ink-muted">{p.reference}</span>
                <span className="min-w-0">
                  <span className="block font-semibold">{p.title}</span>
                  <span className="block text-sm text-ink-muted">
                    {PROPERTY_TYPE_LABEL[p.type]} · {p.localityName} · {p.photos} {p.photos === 1 ? "photo" : "photos"}
                    {p.isFeatured ? " · Featured" : ""}
                  </span>
                </span>
                <span className="text-sm font-semibold">{formatPrice(p, true)}</span>
                <span className="flex flex-wrap gap-1.5">
                  <PublicationBadge status={p.status} />
                  {p.availability !== "available" ? <AvailabilityBadge value={p.availability} /> : null}
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
