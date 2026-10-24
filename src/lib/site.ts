/** Public site configuration. Safe for any server module (no secrets). */

export const BRAND = "HKNR";
export const BRAND_DESCRIPTOR = "Real Estate & Construction";
export const PRIMARY_LOCATION = "Moula Ali, Secunderabad";
export const CITY = "Hyderabad";
export const REGION = "Telangana";

/** Canonical origin: SITE_URL, else Render's assigned URL, else local dev. */
export function siteUrl(): string {
  return (process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function indexingAllowed(): boolean {
  return process.env.ALLOW_INDEXING === "true";
}

export const NAV = [
  { href: "/properties", label: "Properties" },
  { href: "/construction", label: "Construction" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
