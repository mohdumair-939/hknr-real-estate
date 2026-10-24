import { ArrowRight, Building2, HardHat, KeyRound, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactActions } from "@/components/site/contact-actions";
import { HeroDrawing } from "@/components/site/hero-drawing";
import { ProjectCard } from "@/components/site/project-card";
import { PropertyGrid } from "@/components/site/property-card";
import { QuickSearch } from "@/components/site/quick-search";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/layout";
import { Picture } from "@/components/ui/picture";
import { PROPERTY_TYPE_PLURAL } from "@/lib/domain";
import {
  getFeaturedProperties,
  getPropertyFacets,
  getPublicSettings,
  getPublishedProjects,
  getPublishedServices,
} from "@/lib/queries/public";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [settings, facets, featured, projects, services] = await Promise.all([
    getPublicSettings(),
    getPropertyFacets(),
    getFeaturedProperties(6),
    getPublishedProjects({ limit: 3 }),
    getPublishedServices(),
  ]);
  const hasInventory = facets.total > 0;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ivory">
        <div className="container-page grid items-center gap-10 pt-10 pb-12 md:pt-16 lg:grid-cols-12 lg:gap-12 lg:pt-20 lg:pb-20">
          <div className="lg:col-span-6">
            <p className="text-eyebrow flex items-center gap-2 text-bronze-ink">
              <MapPin className="size-4" aria-hidden="true" /> Moula Ali · Secunderabad · Hyderabad
            </p>
            <h1 className="text-display mt-5">
              Homes, plots and construction in&nbsp;Moula&nbsp;Ali.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-muted md:text-xl">
              Buy, sell or build with a local team. Browse current listings with clear prices and measurements, or talk to us
              about building on your land.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <ButtonLink href="/properties" size="lg">
                Browse properties <ArrowRight aria-hidden="true" />
              </ButtonLink>
              <Link
                href="/construction"
                className="inline-flex min-h-11 items-center font-semibold underline decoration-bronze decoration-2 underline-offset-[6px] hover:decoration-ink"
              >
                Talk to us about construction
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6">
            {settings.heroImage ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-md shadow-(--shadow-raised)">
                <Picture
                  image={settings.heroImage}
                  sizes="(min-width: 1024px) 600px, 100vw"
                  priority
                  className="size-full"
                />
              </div>
            ) : (
              <div className="relative mx-auto hidden max-w-xl rounded-md border border-line bg-surface p-4 sm:block sm:p-6">
                <HeroDrawing className="h-auto w-full" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search or new-inventory state */}
      <section aria-labelledby="search-heading" className="relative z-10 -mt-2 lg:-mt-10">
        <div className="container-page">
          <h2 id="search-heading" className="sr-only">
            Find a property
          </h2>
          {hasInventory ? (
            <QuickSearch facets={facets} />
          ) : (
            <div className="flex flex-col gap-4 rounded-md border border-line bg-surface p-6 shadow-(--shadow-raised) md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-h3">New listings are being added.</p>
                <p className="mt-1 text-ink-muted">
                  Tell us what you&apos;re looking for (type, locality and budget) and we&apos;ll contact you when something suitable is
                  available.
                </p>
              </div>
              <ButtonLink href="/contact?topic=buy" className="shrink-0">
                Tell us what you need
              </ButtonLink>
            </div>
          )}
        </div>
      </section>

      {/* Featured listings */}
      {featured.length ? (
        <section className="py-16 md:py-24" aria-labelledby="featured-heading">
          <div className="container-page">
            <SectionHeading
              eyebrow="Current listings"
              title={<span id="featured-heading">Properties available now</span>}
              action={
                <Link href="/properties" className="inline-flex min-h-11 items-center gap-2 font-semibold hover:underline">
                  View all {facets.total} {facets.total === 1 ? "property" : "properties"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />
            <div className="mt-10">
              <PropertyGrid items={featured} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Categories from real data */}
      {facets.types.length > 1 ? (
        <section className="border-y border-line bg-surface py-14" aria-labelledby="categories-heading">
          <div className="container-page">
            <h2 id="categories-heading" className="text-h2">
              Browse by type
            </h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {facets.types.map((t) => (
                <li key={t.value}>
                  <Link
                    href={`/properties?type=${t.value}`}
                    className="group flex min-h-20 items-center justify-between rounded-md border border-line bg-canvas px-5 py-4 transition-colors hover:border-charcoal"
                  >
                    <span>
                      <span className="block font-semibold">{PROPERTY_TYPE_PLURAL[t.value]}</span>
                      <span className="text-sm text-ink-muted">
                        {t.count} {t.count === 1 ? "listing" : "listings"}
                      </span>
                    </span>
                    <ArrowRight className="size-5 text-bronze-ink transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Three ways we help */}
      <section className="py-16 md:py-24" aria-labelledby="help-heading">
        <div className="container-page">
          <SectionHeading eyebrow="How we can help" title={<span id="help-heading">Buy, sell or build</span>} />
          <ul className="mt-10 grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-3">
            {[
              {
                icon: <KeyRound aria-hidden="true" />,
                title: "Buying",
                body: "Search listings by type, locality and budget. Every listing shows its reference number, measurements with units, and current availability.",
                href: "/properties",
                cta: "Browse properties",
              },
              {
                icon: <Building2 aria-hidden="true" />,
                title: "Selling",
                body: "Own a plot, house or flat in or around Moula Ali? Share a few details and HKNR will get in touch to discuss listing it.",
                href: "/sell",
                cta: "Sell your property",
              },
              {
                icon: <HardHat aria-hidden="true" />,
                title: "Building",
                body: "Planning to build on your land? Tell us about your plot and what you have in mind, and we'll arrange a conversation.",
                href: "/construction",
                cta: "Construction services",
              },
            ].map((c) => (
              <li key={c.title} className="flex flex-col bg-surface p-6 md:p-8">
                <div className="text-bronze-ink [&_svg]:size-7">{c.icon}</div>
                <h3 className="text-h3 mt-5">{c.title}</h3>
                <p className="mt-2 flex-1 text-ink-muted">{c.body}</p>
                <Link href={c.href} className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold hover:underline">
                  {c.cta} <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Construction */}
      <section className="on-dark bg-charcoal py-16 text-ink-inverse md:py-24" aria-labelledby="construction-heading">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-eyebrow text-bronze-light">Construction</p>
            <h2 id="construction-heading" className="text-h2 mt-3">
              Building on your own land
            </h2>
            <p className="mt-4 text-lg text-ink-inverse-muted">
              HKNR also takes on construction work. Start with a consultation about your plot, your plans and your budget.
            </p>
            <ButtonLink href="/construction" variant="inverse" size="lg" className="mt-8">
              Request a consultation
            </ButtonLink>
          </div>
          {services.length ? (
            <ul className="grid self-start border-t border-white/15 sm:grid-cols-2 sm:gap-x-8 lg:col-span-7">
              {services.slice(0, 4).map((s) => (
                <li key={s.id} className="border-b border-white/15 py-6">
                  <h3 className="text-h3 text-ivory">{s.title}</h3>
                  {s.summary ? <p className="mt-2 text-sm text-ink-inverse-muted">{s.summary}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {/* Projects */}
      {projects.length ? (
        <section className="py-16 md:py-24" aria-labelledby="projects-heading">
          <div className="container-page">
            <SectionHeading
              eyebrow="Our work"
              title={<span id="projects-heading">Projects</span>}
              action={
                <Link href="/projects" className="inline-flex min-h-11 items-center gap-2 font-semibold hover:underline">
                  All projects <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {projects.map((p) => (
                <li key={p.id}>
                  <ProjectCard p={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Local + contact */}
      <section className="border-t border-line bg-ivory py-16 md:py-20" aria-labelledby="contact-heading">
        <div className="container-page grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-eyebrow text-bronze-ink">Based in Moula Ali</p>
            <h2 id="contact-heading" className="text-h2 mt-3">
              Talk to us about your property plans
            </h2>
            <p className="mt-4 max-w-lg text-lg text-ink-muted">
              Whether you&apos;re buying, selling or planning to build, send us a short enquiry and we&apos;ll get back to you.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <ContactActions settings={settings} whatsappMessage="Hello HKNR, I'd like to know more about your properties." />
            <ButtonLink href="/contact" size="lg">
              Send an enquiry
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
