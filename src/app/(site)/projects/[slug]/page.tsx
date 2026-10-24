import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Gallery } from "@/components/site/gallery";
import { Alert, Badge, SampleBadge } from "@/components/ui/feedback";
import { Breadcrumbs } from "@/components/ui/layout";
import { PROJECT_STAGE_LABEL, PROJECT_TYPE_LABEL } from "@/lib/domain";
import { breadcrumbLd, JsonLd } from "@/lib/json-ld";
import { getProjectBySlug, getSitemapEntries } from "@/lib/queries/public";
import { mediaUrl } from "@/lib/storage/public-url";

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProjectBySlug(slug);
  if (!p) return { title: "Project not found", robots: { index: false } };
  return {
    title: p.title,
    description: (p.summary || p.description).slice(0, 160),
    alternates: { canonical: `/projects/${p.slug}` },
    robots: p.isSample ? { index: false, follow: false } : undefined,
  };
}

// Blocks on a cached slug lookup so unknown slugs get a real 404 instead of a streamed soft-404.
export const instant = false;

export async function generateStaticParams() {
  const { projects } = await getSitemapEntries();
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: "no-projects-yet" }];
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  // Resolved before any Suspense boundary so a missing project returns a real HTTP 404.
  const p = await getProjectBySlug(slug);
  if (!p) notFound();
  const images = p.images.map((img) => ({
    src: mediaUrl(img.storageKey, img.variants.find((w) => w >= 960) ?? img.variants.at(-1)!),
    srcSet: img.variants.map((w) => `${mediaUrl(img.storageKey, w)} ${w}w`).join(", "),
    width: img.width,
    height: img.height,
    alt: img.altText,
    blur: img.blurDataUrl,
  }));

  return (
    <article className="container-page py-8 md:py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: p.title, path: `/projects/${p.slug}` },
        ])}
      />
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/projects", label: "Projects" }, { label: p.title }]} />
      {p.isSample ? (
        <Alert tone="warning" title="Sample project" className="mt-6">
          Synthetic development data. Not a real HKNR project, and hidden on the live site.
        </Alert>
      ) : null}
      <header className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-eyebrow text-bronze-ink">{PROJECT_TYPE_LABEL[p.type]}</p>
          <Badge tone={p.stage === "completed" ? "dark" : "bronze"}>{PROJECT_STAGE_LABEL[p.stage]}</Badge>
          {p.isSample ? <SampleBadge /> : null}
        </div>
        <h1 className="text-h1 mt-3">{p.title}</h1>
        <p className="mt-3 text-ink-muted">
          {[p.localityName, p.completionYear ? `Completed ${p.completionYear}` : null].filter(Boolean).join(" · ")}
        </p>
      </header>

      {images.length ? (
        <div className="mt-8">
          <Gallery images={images} title={p.title} />
        </div>
      ) : null}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0">
          {p.summary ? <p className="prose-body text-xl leading-relaxed">{p.summary}</p> : null}
          {p.description ? <div className="prose-body mt-6 text-lg whitespace-pre-line">{p.description}</div> : null}
          {p.specifications.length ? (
            <section aria-labelledby="spec-heading" className="mt-12">
              <h2 id="spec-heading" className="text-h2">
                Specifications
              </h2>
              <dl className="mt-6 divide-y divide-line border-y border-line">
                {p.specifications.map((s) => (
                  <div key={s.label} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr]">
                    <dt className="text-ink-muted">{s.label}</dt>
                    <dd className="font-semibold">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
        <aside aria-labelledby="proj-enq" className="lg:self-start">
          <div className="rounded-md border border-line bg-surface p-5 sm:p-6">
            <h2 id="proj-enq" className="text-h3">
              Planning something similar?
            </h2>
            <div className="mt-5">
              <EnquiryForm
                category="construction"
                projectId={p.id}
                subject={`${p.reference} — ${p.title}`}
                idPrefix="pj"
                messagePlaceholder="Tell us about your plot and what you'd like to build."
                submitLabel="Request consultation"
              />
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
