import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactActions } from "@/components/site/contact-actions";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { ProjectCard } from "@/components/site/project-card";
import { SampleBadge } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/layout";
import { getPublicSettings, getPublishedProjects, getPublishedServices } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Construction services in Moula Ali",
  description:
    "Planning to build a home on your land in or around Moula Ali, Secunderabad? Request a construction consultation with HKNR.",
  alternates: { canonical: "/construction" },
};

export default async function ConstructionPage() {
  const [services, projects, settings] = await Promise.all([
    getPublishedServices(),
    getPublishedProjects({ limit: 3 }),
    getPublicSettings(),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Construction" }]}
        eyebrow="Construction"
        title="Building on your own land"
        intro="If you own a plot and want to build, start with a consultation. Tell us about the land, what you'd like to build and your budget, and we'll take it from there."
      />

      <div className="container-page grid gap-14 py-12 md:py-16 lg:grid-cols-[1fr_26rem]">
        <div className="min-w-0">
          {services.length ? (
            <section aria-labelledby="services-heading">
              <h2 id="services-heading" className="text-h2">
                What we can help with
              </h2>
              <ul className="mt-8 divide-y divide-line border-y border-line">
                {services.map((s, i) => (
                  <li key={s.id} className="grid gap-2 py-7 sm:grid-cols-[3rem_1fr]">
                    <span className="font-display text-2xl text-bronze-ink" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-h3 flex flex-wrap items-center gap-2">
                        {s.title} {s.isSample ? <SampleBadge /> : null}
                      </h3>
                      {s.summary ? <p className="mt-2 text-ink-muted">{s.summary}</p> : null}
                      {s.body ? <p className="mt-3 whitespace-pre-line">{s.body}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section aria-labelledby="services-heading">
              <h2 id="services-heading" className="text-h2">
                Start with a conversation
              </h2>
              <p className="prose-body mt-4 text-lg text-ink-muted">
                Every plot and every plan is different, so the first step is a conversation about your land and what you want to
                build. Use the form to tell us a little about your project and we&apos;ll contact you to discuss it.
              </p>
            </section>
          )}

          <section aria-labelledby="prepare-heading" className="mt-14">
            <h2 id="prepare-heading" className="text-h2">
              Helpful to have ready
            </h2>
            <p className="mt-3 text-ink-muted">None of this is required to get in touch, but it makes the first conversation more useful.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Plot location and size (sq yd)",
                "Which way the plot faces",
                "Number of floors and rooms you have in mind",
                "Rough budget and timeline",
                "Any existing plans or approvals",
                "Photos of the site, if you have them",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 rounded-md border border-line bg-surface px-4 py-3">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-bronze" />
                  {t}
                </li>
              ))}
            </ul>
          </section>

          {projects.length ? (
            <section aria-labelledby="work-heading" className="mt-14">
              <div className="flex items-end justify-between gap-4">
                <h2 id="work-heading" className="text-h2">
                  Our projects
                </h2>
                <Link href="/projects" className="inline-flex min-h-11 items-center gap-2 font-semibold hover:underline">
                  All projects <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                {projects.slice(0, 2).map((p) => (
                  <li key={p.id}>
                    <ProjectCard p={p} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside aria-labelledby="consult-heading" className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div id="consultation" className="scroll-mt-24 rounded-md border border-line bg-surface p-5 shadow-(--shadow-card) sm:p-6">
            <h2 id="consult-heading" className="text-h3">
              Request a consultation
            </h2>
            <p className="mt-1 text-sm text-ink-muted">We&apos;ll get back to you to arrange a conversation.</p>
            <ContactActions
              settings={settings}
              whatsappMessage="Hello HKNR, I'd like to discuss a construction project."
              size="md"
              stacked
              className="mt-4"
            />
            <div className="mt-5 border-t border-line pt-5">
              <EnquiryForm
                category="construction"
                idPrefix="cons"
                messagePlaceholder="Where is your plot, how big is it, and what would you like to build?"
                submitLabel="Request consultation"
              />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
