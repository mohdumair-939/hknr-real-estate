import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyDetail } from "@/components/site/property-detail";
import { PROPERTY_TYPE_LABEL } from "@/lib/domain";
import { formatPrice } from "@/lib/format";
import { getPropertyBySlug, getSitemapEntries } from "@/lib/queries/public";
import { mediaUrl } from "@/lib/storage/public-url";

export async function generateMetadata(props: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getPropertyBySlug(slug);
  if (!p) return { title: "Property not found", robots: { index: false } };
  const facts = [PROPERTY_TYPE_LABEL[p.type], p.localityName, formatPrice(p, true)].join(" · ");
  const cover = p.images[0];
  return {
    title: `${p.title}, ${p.localityName}`,
    description: `${facts}. ${p.description.slice(0, 120)}`.slice(0, 160),
    alternates: { canonical: `/properties/${p.slug}` },
    robots: p.isSample ? { index: false, follow: false } : undefined,
    openGraph: {
      title: p.title,
      description: facts,
      url: `/properties/${p.slug}`,
      images: cover ? [{ url: mediaUrl(cover.storageKey, cover.variants.find((w) => w >= 960) ?? cover.variants.at(-1)!), alt: cover.altText }] : undefined,
    },
  };
}

// Blocks on a cached slug lookup so unknown slugs get a real 404 instead of a streamed soft-404.
export const instant = false;

export async function generateStaticParams() {
  const { properties } = await getSitemapEntries();
  // At least one entry is required; an unknown slug simply renders the 404 page.
  return properties.length ? properties.map((p) => ({ slug: p.slug })) : [{ slug: "no-listings-yet" }];
}

export default async function PropertyPage(props: PageProps<"/properties/[slug]">) {
  const { slug } = await props.params;
  // Resolved before any Suspense boundary so a missing listing returns a real HTTP 404.
  const p = await getPropertyBySlug(slug);
  if (!p) notFound();
  return <PropertyDetail p={p} />;
}

