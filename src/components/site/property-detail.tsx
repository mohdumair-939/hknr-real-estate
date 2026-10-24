import { MapPin } from "lucide-react";
import { ContactActions } from "@/components/site/contact-actions";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Gallery } from "@/components/site/gallery";
import { PropertyGrid } from "@/components/site/property-card";
import { RecordView, SaveButton } from "@/components/site/save-button";
import { Alert, Badge, SampleBadge } from "@/components/ui/feedback";
import { Breadcrumbs } from "@/components/ui/layout";
import { NoPhoto } from "@/components/ui/picture";
import {
  AREA_UNIT_LONG,
  AVAILABILITY_LABEL,
  CONSTRUCTION_STATUS_LABEL,
  FACING_LABEL,
  PROPERTY_TYPE_LABEL,
  TRANSACTION_LABEL,
} from "@/lib/domain";
import { formatArea, formatInr, formatPrice } from "@/lib/format";
import { breadcrumbLd, JsonLd } from "@/lib/json-ld";
import { getPublicSettings, getRelatedProperties, type PublicProperty } from "@/lib/queries/public";
import { siteUrl } from "@/lib/site";
import { mediaUrl } from "@/lib/storage/public-url";

function facts(p: PublicProperty): { label: string; value: string; hint?: string }[] {
  const out: { label: string; value: string; hint?: string }[] = [];
  out.push({ label: "Property type", value: PROPERTY_TYPE_LABEL[p.type] });
  out.push({ label: "Listing for", value: TRANSACTION_LABEL[p.transaction] });
  if (p.plotArea && p.plotAreaUnit)
    out.push({ label: "Plot area", value: formatArea(p.plotArea, p.plotAreaUnit)!, hint: `Land area in ${AREA_UNIT_LONG[p.plotAreaUnit]}` });
  if (p.builtUpAreaSqft)
    out.push({ label: "Built-up area", value: formatArea(p.builtUpAreaSqft, "sq_ft")!, hint: "Floor area including walls" });
  if (p.carpetAreaSqft)
    out.push({ label: "Carpet area", value: formatArea(p.carpetAreaSqft, "sq_ft")!, hint: "Usable floor area inside the walls" });
  if (p.bedrooms != null) out.push({ label: "Bedrooms", value: String(p.bedrooms) });
  if (p.bathrooms != null) out.push({ label: "Bathrooms", value: String(p.bathrooms) });
  if (p.facing) out.push({ label: "Facing", value: FACING_LABEL[p.facing], hint: "Direction the main entrance or plot front faces" });
  if (p.floorNumber != null)
    out.push({
      label: "Floor",
      value: p.floorNumber === 0 ? "Ground" : p.totalFloors ? `${p.floorNumber} of ${p.totalFloors}` : String(p.floorNumber),
    });
  else if (p.totalFloors) out.push({ label: "Floors", value: String(p.totalFloors) });
  if (p.constructionStatus && p.constructionStatus !== "not_applicable")
    out.push({ label: "Construction status", value: CONSTRUCTION_STATUS_LABEL[p.constructionStatus] });
  out.push({ label: "Availability", value: AVAILABILITY_LABEL[p.availability] });
  return out;
}

/**
 * Full listing page body. Used by the public route and by the admin preview
 * (`preview` hides tracking, structured data, the enquiry form and related listings).
 */
export async function PropertyDetail({ p, preview = false }: { p: PublicProperty; preview?: boolean }) {
  const settings = await getPublicSettings();
  const related = preview ? [] : await getRelatedProperties({ id: p.id, type: p.type, localityId: p.localityId });

  const url = `${siteUrl()}/properties/${p.slug}`;
  const waMessage = `Hello HKNR, I'm interested in ${p.reference} — ${p.title}. ${url}`;
  const images = p.images.map((img) => ({
    src: mediaUrl(img.storageKey, img.variants.find((w) => w >= 960) ?? img.variants.at(-1)!),
    srcSet: img.variants.map((w) => `${mediaUrl(img.storageKey, w)} ${w}w`).join(", "),
    width: img.width,
    height: img.height,
    alt: img.altText,
    blur: img.blurDataUrl,
  }));
  const inactive = p.availability !== "available";

  return (
    <article className="pb-28 lg:pb-0">
      {preview ? null : <RecordView id={p.id} />}
      {preview ? null : <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Properties", path: "/properties" },
          { name: p.title, path: `/properties/${p.slug}` },
        ])}
      />}

      <div className="container-page pt-6 md:pt-8">
        <Breadcrumbs
          items={[{ href: "/", label: "Home" }, { href: "/properties", label: "Properties" }, { label: p.reference }]}
        />

        {p.isSample ? (
          <Alert tone="warning" title="Sample listing" className="mt-6">
            This is synthetic development data used to review the design. It is not a real property and is hidden on the live site.
          </Alert>
        ) : null}

        <header className="mt-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-eyebrow text-bronze-ink">{PROPERTY_TYPE_LABEL[p.type]}</p>
              {inactive ? <Badge tone="dark">{AVAILABILITY_LABEL[p.availability]}</Badge> : null}
              {p.isSample ? <SampleBadge /> : null}
            </div>
            <h1 className="text-h1 mt-3">{p.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-muted">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" /> {p.localityName}
              </span>
              <span>Ref. {p.reference}</span>
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-3xl font-bold tracking-tight">
              {formatPrice(p)}
              {p.transaction === "rent" && !p.priceOnRequest && p.priceInr ? (
                <span className="text-base font-medium text-ink-muted"> / month</span>
              ) : null}
            </p>
            {p.priceNegotiable && !p.priceOnRequest ? <p className="text-sm text-ink-muted">Negotiable</p> : null}
          </div>
        </header>

        <div className="mt-6">
          {images.length ? (
            <Gallery images={images} title={p.title} />
          ) : (
            <div className="aspect-[16/9] overflow-hidden rounded-md">
              <NoPhoto />
            </div>
          )}
        </div>
      </div>

      <div className="container-page mt-10 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0">
          <section aria-labelledby="facts-heading">
            <h2 id="facts-heading" className="text-h2">
              Key details
            </h2>
            <dl className="mt-6 grid overflow-hidden rounded-md border-x border-t border-line bg-surface sm:grid-cols-2">
              {facts(p).map((f) => (
                <div key={f.label} className="border-b border-line px-4 py-3.5 sm:odd:border-r">
                  <dt className="text-sm text-ink-muted">{f.label}</dt>
                  <dd className="mt-0.5 font-semibold">
                    {f.value}
                    {f.hint ? <span className="mt-0.5 block text-xs font-normal text-ink-muted">{f.hint}</span> : null}
                  </dd>
                </div>
              ))}
              {p.priceInr && !p.priceOnRequest ? (
                <div className="border-b border-line px-4 py-3.5 sm:odd:border-r">
                  <dt className="text-sm text-ink-muted">Asking price</dt>
                  <dd className="mt-0.5 font-semibold">{formatInr(p.priceInr)}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {p.description ? (
            <section aria-labelledby="desc-heading" className="mt-12">
              <h2 id="desc-heading" className="text-h2">
                About this property
              </h2>
              <div className="prose-body mt-4 whitespace-pre-line text-lg leading-relaxed">{p.description}</div>
            </section>
          ) : null}

          {p.features.length ? (
            <section aria-labelledby="features-heading" className="mt-12">
              <h2 id="features-heading" className="text-h2">
                Features
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 bg-bronze" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {p.locationNote || p.approvals || p.reraNumber ? (
            <section aria-labelledby="loc-heading" className="mt-12">
              <h2 id="loc-heading" className="text-h2">
                Location and approvals
              </h2>
              <dl className="mt-4 space-y-4">
                {p.locationNote ? (
                  <div>
                    <dt className="text-sm text-ink-muted">Location</dt>
                    <dd className="mt-0.5 whitespace-pre-line">{p.locationNote}</dd>
                  </div>
                ) : null}
                {p.approvals ? (
                  <div>
                    <dt className="text-sm text-ink-muted">Approvals</dt>
                    <dd className="mt-0.5 whitespace-pre-line">{p.approvals}</dd>
                  </div>
                ) : null}
                {p.reraNumber ? (
                  <div>
                    <dt className="text-sm text-ink-muted">TS-RERA registration</dt>
                    <dd className="mt-0.5 font-semibold">{p.reraNumber}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-4 text-sm text-ink-muted">
                Please verify documents and approvals independently before any purchase.
              </p>
            </section>
          ) : null}
        </div>

        <aside aria-labelledby="enquire-heading" className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div id="enquire" className="scroll-mt-24 rounded-md border border-line bg-surface p-5 shadow-(--shadow-card) sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 id="enquire-heading" className="text-h3">
                Interested in this property?
              </h2>
              <SaveButton id={p.id} title={p.title} />
            </div>
            <ContactActions settings={settings} whatsappMessage={waMessage} className="mt-4" size="md" stacked />
            <div className="mt-5 border-t border-line pt-5">
              {preview ? (
                <p className="text-sm text-ink-muted">The enquiry form appears here on the live listing.</p>
              ) : <EnquiryForm
                category={p.transaction === "rent" ? "general" : "buy"}
                propertyId={p.id}
                subject={`${p.reference} — ${p.title}`}
                messagePlaceholder="Any questions about this property, or a good time to call?"
                submitLabel="Send enquiry"
                idPrefix="pd"
              />}
            </div>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section aria-labelledby="related-heading" className="mt-20 border-t border-line bg-ivory py-14">
          <div className="container-page">
            <h2 id="related-heading" className="text-h2">
              Similar properties
            </h2>
            <div className="mt-8">
              <PropertyGrid items={related} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Mobile action bar: only actions that exist; sits above the safe area. */}
      <div className="fixed inset-x-0 bottom-0 z-(--z-header) border-t border-line bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="flex gap-2">
          <a
            href="#enquire"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-md bg-charcoal px-4 font-semibold text-ivory"
          >
            Enquire
          </a>
          <ContactActions settings={settings} whatsappMessage={waMessage} size="md" className="flex-nowrap [&>a]:px-3" />
        </div>
      </div>
    </article>
  );
}
