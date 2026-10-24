import { Menu, Phone } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { formatPhoneDisplay, telHref } from "@/lib/format";
import { NAV } from "@/lib/site";
import { getPublicSettings } from "@/lib/queries/public";
import { Wordmark } from "./brand";
import { MobileNav } from "./mobile-nav";
import { DesktopNav } from "./nav-links";

export async function SiteHeader() {
  const settings = await getPublicSettings();
  const phoneHref = settings.phone ? telHref(settings.phone) : null;
  const phoneLabel = settings.phone ? formatPhoneDisplay(settings.phone) : null;

  return (
    <header className="sticky top-0 z-(--z-header) border-b border-line bg-canvas/95 backdrop-blur-sm supports-[backdrop-filter]:bg-canvas/85">
      <div className="container-page flex h-(--header-h) items-center justify-between gap-4">
        <Wordmark />
        <Suspense fallback={<StaticNav />}>
          <DesktopNav />
        </Suspense>
        <div className="flex items-center gap-1 sm:gap-2">
          {phoneHref ? (
            <a
              href={phoneHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-2.5 text-sm font-semibold text-ink hover:bg-sunken"
            >
              <Phone className="size-5 lg:size-4" aria-hidden="true" />
              <span className="sr-only lg:not-sr-only">{phoneLabel}</span>
              <span className="sr-only lg:hidden">Call HKNR</span>
            </a>
          ) : null}
          <span className="hidden sm:block">
            <ButtonLink href="/contact" size="sm">
              Enquire
            </ButtonLink>
          </span>
          <Suspense
            fallback={
              <span className="inline-flex size-11 items-center justify-center lg:hidden" aria-hidden="true">
                <Menu className="size-6" />
              </span>
            }
          >
            <MobileNav phoneHref={phoneHref} phoneLabel={phoneLabel} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/** Shown in the static shell until the active-link state (which reads the URL) streams in. */
function StaticNav() {
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {NAV.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="inline-flex min-h-11 items-center px-3 text-[0.9375rem] font-medium text-ink-muted hover:text-ink">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
