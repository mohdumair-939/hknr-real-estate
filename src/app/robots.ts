import type { MetadataRoute } from "next";
import { indexingAllowed, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed()) {
    // Previews and temporary platform URLs stay out of search results until launch.
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/saved", "/media/", "/*?*sort="] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
