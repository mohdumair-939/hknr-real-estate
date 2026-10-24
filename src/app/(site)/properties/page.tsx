import { ChevronLeft, ChevronRight, SearchX, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogueFilters, CatalogueShell, ResultsRegion, SortSelect } from "@/components/site/catalogue-controls";
import { PropertyGrid, PropertyGridSkeleton } from "@/components/site/property-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import { PROPERTY_TYPE_LABEL, TRANSACTION_LABEL } from "@/lib/domain";
import { filtersToQuery, parseFilters, type PropertyFilters } from "@/lib/filters";
import { formatInrCompact } from "@/lib/format";
import { getPropertyFacets, searchProperties, type Facets } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Properties for sale in Moula Ali and nearby",
  description:
    "Browse plots, independent houses and apartments listed by HKNR in Moula Ali, Secunderabad. Filter by type, locality, budget and bedrooms.",
  // Every filtered variant points here, so search engines index one catalogue URL.
  alternates: { canonical: "/properties" },
};

export default function PropertiesPage(props: PageProps<"/properties">) {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Properties" }]}
        title="Properties"
        intro="Current listings from HKNR. Every listing shows its reference number, measurements and availability."
      />
      <div className="container-page py-8 md:py-12">
        <Suspense fallback={<CatalogueFallback />}>
          <Catalogue searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}

function CatalogueFallback() {
  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <div className="hidden space-y-3 lg:block" aria-hidden="true">
        <div className="skeleton h-11" />
        <div className="skeleton h-96" />
      </div>
      <div>
        <div className="skeleton mb-6 h-6 w-48" aria-hidden="true" />
        <PropertyGridSkeleton />
        <p className="sr-only" role="status">
          Loading properties…
        </p>
      </div>
    </div>
  );
}

function chipsFor(f: PropertyFilters, facets: Facets) {
  const chips: { label: string; without: Partial<PropertyFilters> }[] = [];
  if (f.q) chips.push({ label: `“${f.q}”`, without: { q: undefined } });
  if (f.type) chips.push({ label: PROPERTY_TYPE_LABEL[f.type], without: { type: undefined } });
  if (f.txn) chips.push({ label: TRANSACTION_LABEL[f.txn], without: { txn: undefined } });
  if (f.locality)
    chips.push({ label: facets.localities.find((l) => l.slug === f.locality)?.name ?? f.locality, without: { locality: undefined } });
  if (f.min && f.max) chips.push({ label: `${formatInrCompact(f.min)} – ${formatInrCompact(f.max)}`, without: { min: undefined, max: undefined } });
  else if (f.min) chips.push({ label: `From ${formatInrCompact(f.min)}`, without: { min: undefined } });
  else if (f.max) chips.push({ label: `Up to ${formatInrCompact(f.max)}`, without: { max: undefined } });
  if (f.beds) chips.push({ label: `${f.beds}+ bedrooms`, without: { beds: undefined } });
  return chips;
}

async function Catalogue({ searchParams }: { searchParams: PageProps<"/properties">["searchParams"] }) {
  const filters = parseFilters(await searchParams);
  const [facets, result] = await Promise.all([getPropertyFacets(), searchProperties(filters)]);
  const chips = chipsFor(filters, facets);

  if (facets.total === 0) {
    return (
      <EmptyState
        title="New listings are on the way"
        action={
          <>
            <ButtonLink href="/contact?topic=buy">Tell us what you&apos;re looking for</ButtonLink>
            <ButtonLink href="/sell" variant="secondary">
              List your property with us
            </ButtonLink>
          </>
        }
      >
        HKNR is adding its current properties to the website. Share your requirements and we&apos;ll contact you when
        something suitable is available.
      </EmptyState>
    );
  }

  return (
    <CatalogueShell>
      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <CatalogueFilters facets={facets} filters={filters} activeCount={chips.length} />
        </div>

        <ResultsRegion>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold" role="status">
              {result.total === 0
                ? "No properties match"
                : `${result.total} ${result.total === 1 ? "property" : "properties"}`}
              {result.pageCount > 1 ? (
                <span className="font-normal text-ink-muted">
                  {" "}
                  · page {result.page} of {result.pageCount}
                </span>
              ) : null}
            </p>
            <SortSelect filters={filters} />
          </div>

          {chips.length ? (
            <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Applied filters">
              {chips.map((c) => (
                <li key={c.label}>
                  <Link
                    href={`/properties${filtersToQuery({ ...filters, ...c.without, page: 1 })}`}
                    scroll={false}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface py-1 pr-2.5 pl-3.5 text-sm hover:border-ink"
                  >
                    {c.label}
                    <X className="size-4 text-ink-muted" aria-hidden="true" />
                    <span className="sr-only">— remove this filter</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`/properties${filtersToQuery({ sort: filters.sort })}`}
                  scroll={false}
                  className="inline-flex min-h-9 items-center px-2 text-sm font-semibold underline underline-offset-4"
                >
                  Clear all filters
                </Link>
              </li>
            </ul>
          ) : null}

          <div className="mt-6">
            {result.items.length ? (
              <PropertyGrid items={result.items} priorityCount={2} headingLevel="h2" />
            ) : (
              <EmptyState
                icon={<SearchX aria-hidden="true" />}
                title="No properties match these filters"
                action={
                  <>
                    <ButtonLink href={`/properties${filtersToQuery({ sort: filters.sort })}`} variant="secondary" scroll={false}>
                      Clear filters
                    </ButtonLink>
                    <ButtonLink href="/contact?topic=buy">Ask us to find one</ButtonLink>
                  </>
                }
              >
                Try removing a filter or widening your budget. Or tell us what you need and we&apos;ll let you know when
                something suitable comes up.
              </EmptyState>
            )}
          </div>

          {result.pageCount > 1 ? <Pagination filters={filters} page={result.page} pageCount={result.pageCount} /> : null}
        </ResultsRegion>
      </div>
    </CatalogueShell>
  );
}

function Pagination({ filters, page, pageCount }: { filters: PropertyFilters; page: number; pageCount: number }) {
  const href = (p: number) => `/properties${filtersToQuery({ ...filters, page: p })}`;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  const item = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm font-semibold";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "border border-line-strong bg-surface hover:bg-sunken")} rel="prev">
          <ChevronLeft className="size-4" aria-hidden="true" /> <span className="sr-only sm:not-sr-only">Previous</span>
        </Link>
      ) : null}
      <ul className="flex items-center gap-1">
        {pages.map((p, i) => (
          <li key={p} className="flex items-center gap-1">
            {i > 0 && p - pages[i - 1] > 1 ? <span className="px-1 text-ink-muted">…</span> : null}
            <Link
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(item, p === page ? "bg-charcoal text-ivory" : "hover:bg-sunken")}
            >
              <span className="sr-only">Page </span>
              {p}
            </Link>
          </li>
        ))}
      </ul>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={cn(item, "border border-line-strong bg-surface hover:bg-sunken")} rel="next">
          <span className="sr-only sm:not-sr-only">Next</span> <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
