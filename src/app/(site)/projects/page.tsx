import { HardHat } from "lucide-react";
import type { Metadata } from "next";
import { ProjectCard } from "@/components/site/project-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/layout";
import { getPublishedProjects } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Projects",
  description: "Construction projects by HKNR in and around Moula Ali, Secunderabad.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();
  const ongoing = projects.filter((p) => p.stage === "ongoing");
  const completed = projects.filter((p) => p.stage === "completed");

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Projects" }]}
        eyebrow="Our work"
        title="Projects"
        intro="Construction work by HKNR, with photographs from the sites themselves."
      />
      <div className="container-page py-12 md:py-16">
        {projects.length === 0 ? (
          <EmptyState
            icon={<HardHat aria-hidden="true" />}
            title="Project photos are being prepared"
            action={<ButtonLink href="/construction">Talk to us about your project</ButtonLink>}
          >
            We&apos;re putting together photographs and details of our work. In the meantime, we&apos;re happy to talk about what
            you&apos;d like to build.
          </EmptyState>
        ) : (
          <div className="space-y-16">
            {[
              { title: "Ongoing", items: ongoing },
              { title: "Completed", items: completed },
            ]
              .filter((g) => g.items.length)
              .map((g) => (
                <section key={g.title} aria-labelledby={`g-${g.title}`}>
                  <h2 id={`g-${g.title}`} className="text-h2">
                    {g.title}
                  </h2>
                  <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((p) => (
                      <li key={p.id}>
                        <ProjectCard p={p} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
