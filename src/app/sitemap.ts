import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/queries/public";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { properties, projects } = await getSitemapEntries();
  const pages = ["", "/properties", "/construction", "/projects", "/about", "/contact", "/sell", "/privacy", "/terms"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...properties.map((p) => ({ url: `${base}/properties/${p.slug}`, lastModified: p.updatedAt })),
    ...projects.map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
