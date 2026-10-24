import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { BRAND, BRAND_DESCRIPTOR, indexingAllowed, PRIMARY_LOCATION, siteUrl } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

// Display serif for marketing headings only. Variable font with optical sizing.
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${BRAND} — ${BRAND_DESCRIPTOR} in ${PRIMARY_LOCATION}`,
    template: `%s · ${BRAND}`,
  },
  description: `${BRAND} helps people buy, sell and build homes in ${PRIMARY_LOCATION}, Hyderabad. Browse plots, independent houses and apartments, or talk to us about construction.`,
  applicationName: BRAND,
  robots: indexingAllowed() ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { type: "website", siteName: BRAND, locale: "en_IN" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#242522",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${manrope.variable} ${newsreader.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
