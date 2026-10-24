import { cacheLife } from "next/cache";
import Link from "next/link";
import { formatPhoneDisplay, telHref } from "@/lib/format";
import { getPublicSettings } from "@/lib/queries/public";
import { NAV, PRIMARY_LOCATION } from "@/lib/site";
import { Wordmark } from "./brand";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export async function SiteFooter() {
  const s = await getPublicSettings();
  const socials = [
    { href: s.socials.instagram, label: "Instagram" },
    { href: s.socials.facebook, label: "Facebook" },
    { href: s.socials.youtube, label: "YouTube" },
    { href: s.socials.googleBusiness, label: "Google Business Profile" },
  ].filter((x): x is { href: string; label: string } => Boolean(x.href));
  const hasContact = Boolean(s.phone || s.email || s.address);

  return (
    <footer className="on-dark bg-charcoal text-ink-inverse">
      <div className="container-page grid gap-10 py-14 md:grid-cols-12 md:py-16">
        <div className="md:col-span-4">
          <Wordmark inverse />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-inverse-muted">
            Property and construction services based in {PRIMARY_LOCATION}, Hyderabad.
          </p>
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="text-eyebrow text-bronze-light">Explore</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {[...NAV, { href: "/sell", label: "Sell your property" }, { href: "/saved", label: "Saved properties" }].map(
              (item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-9 items-center text-ink-inverse hover:text-white hover:underline">
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="md:col-span-5">
          <h2 className="text-eyebrow text-bronze-light">Contact</h2>
          {hasContact ? (
            <dl className="mt-4 space-y-3 text-sm">
              {s.phone ? (
                <div>
                  <dt className="text-ink-inverse-muted">Phone</dt>
                  <dd>
                    <a href={telHref(s.phone)} className="text-base hover:underline">
                      {formatPhoneDisplay(s.phone)}
                    </a>
                  </dd>
                </div>
              ) : null}
              {s.email ? (
                <div>
                  <dt className="text-ink-inverse-muted">Email</dt>
                  <dd>
                    <a href={`mailto:${s.email}`} className="break-all hover:underline">
                      {s.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {s.address ? (
                <div>
                  <dt className="text-ink-inverse-muted">Office</dt>
                  <dd className="whitespace-pre-line">{s.address}</dd>
                </div>
              ) : null}
              {s.openingHours ? (
                <div>
                  <dt className="text-ink-inverse-muted">Hours</dt>
                  <dd className="whitespace-pre-line">{s.openingHours}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="mt-4 max-w-sm text-sm text-ink-inverse-muted">
              Send us a message through the{" "}
              <Link href="/contact" className="text-ink-inverse underline underline-offset-4">
                enquiry form
              </Link>{" "}
              and we&apos;ll get back to you.
            </p>
          )}
          {socials.length ? (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {socials.map((x) => (
                <li key={x.label}>
                  <a href={x.href} rel="noopener noreferrer" target="_blank" className="underline-offset-4 hover:underline">
                    {x.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-ink-inverse-muted md:flex-row md:items-center md:justify-between">
          <p>
            © <CopyrightYear /> {s.legalName ?? "HKNR"}. All rights reserved.
            {s.registrationsText ? <span className="mt-1 block md:mt-0 md:ml-2 md:inline">{s.registrationsText}</span> : null}
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href="/privacy" className="inline-flex min-h-9 items-center hover:text-ink-inverse hover:underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="inline-flex min-h-9 items-center hover:text-ink-inverse hover:underline">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
