import { BedDouble, Bath, MapPin, Ruler } from "lucide-react";
import Link from "next/link";
import { Badge, SampleBadge } from "@/components/ui/feedback";
import { NoPhoto, Picture } from "@/components/ui/picture";
import { AVAILABILITY_LABEL, PROPERTY_TYPE_LABEL, TRANSACTION_LABEL } from "@/lib/domain";
import { formatArea, formatPrice } from "@/lib/format";
import type { PropertyCardData } from "@/lib/queries/public";
import { SaveButton } from "./save-button";

/** Primary area shown on a card: plot area for land/houses, built-up area otherwise. */
function headlineArea(p: PropertyCardData): string | null {
  if (p.type === "plot" && p.plotArea && p.plotAreaUnit) return formatArea(p.plotArea, p.plotAreaUnit);
  if (p.builtUpAreaSqft) return `${formatArea(p.builtUpAreaSqft, "sq_ft")} built-up`;
  if (p.plotArea && p.plotAreaUnit) return `${formatArea(p.plotArea, p.plotAreaUnit)} plot`;
  return null;
}

export function PropertyCard({ p, priority = false, headingLevel = "h3" }: { p: PropertyCardData; priority?: boolean; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const area = headlineArea(p);
  const inactive = p.availability !== "available";
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-raised)">
      <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
        {p.cover ? (
          <Picture
            image={p.cover}
            alt=""
            sizes="(min-width: 1280px) 384px, (min-width: 768px) 50vw, 100vw"
            priority={priority}
            className="size-full transition-transform duration-500 ease-(--ease-standard) group-hover:scale-[1.03]"
          />
        ) : (
          <NoPhoto />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {inactive ? <Badge tone="dark">{AVAILABILITY_LABEL[p.availability]}</Badge> : null}
          {p.isSample ? <SampleBadge /> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-eyebrow text-bronze-ink">
            {PROPERTY_TYPE_LABEL[p.type]}
            {p.transaction === "rent" ? ` · ${TRANSACTION_LABEL.rent}` : ""}
          </p>
          <p className="text-xs text-ink-muted">{p.reference}</p>
        </div>
        <Heading className="text-h3 leading-snug">
          <Link
            href={`/properties/${p.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-focus"
          >
            {p.title}
          </Link>
        </Heading>
        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {p.localityName}
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink" aria-label="Key details">
          {area ? (
            <li className="flex items-center gap-1.5">
              <Ruler className="size-4 text-ink-muted" aria-hidden="true" />
              {area}
            </li>
          ) : null}
          {p.bedrooms != null ? (
            <li className="flex items-center gap-1.5">
              <BedDouble className="size-4 text-ink-muted" aria-hidden="true" />
              {p.bedrooms} {p.bedrooms === 1 ? "bedroom" : "bedrooms"}
            </li>
          ) : null}
          {p.bathrooms != null ? (
            <li className="flex items-center gap-1.5">
              <Bath className="size-4 text-ink-muted" aria-hidden="true" />
              {p.bathrooms} {p.bathrooms === 1 ? "bathroom" : "bathrooms"}
            </li>
          ) : null}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
          <p className="text-lg font-bold tracking-tight">
            {formatPrice(p, true)}
            {p.transaction === "rent" && p.priceInr && !p.priceOnRequest ? (
              <span className="text-sm font-medium text-ink-muted"> / month</span>
            ) : null}
          </p>
          {/* Sits above the card's stretched link. */}
          <div className="relative z-10">
            <SaveButton id={p.id} title={p.title} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function PropertyGrid({ items, priorityCount = 0, headingLevel }: { items: PropertyCardData[]; priorityCount?: number; headingLevel?: "h2" | "h3" }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {items.map((p, i) => (
        <li key={p.id} className="flex">
          <div className="w-full">
            <PropertyCard p={p} priority={i < priorityCount} headingLevel={headingLevel} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-md border border-line bg-surface">
          <div className="skeleton aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-5">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-5 w-4/5" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-6 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
