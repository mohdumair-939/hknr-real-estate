import Link from "next/link";
import { Badge, SampleBadge } from "@/components/ui/feedback";
import { NoPhoto, Picture } from "@/components/ui/picture";
import { PROJECT_STAGE_LABEL, PROJECT_TYPE_LABEL } from "@/lib/domain";
import type { ProjectCardData } from "@/lib/queries/public";

export function ProjectCard({ p }: { p: ProjectCardData }) {
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-sunken">
        {p.cover ? (
          <Picture
            image={p.cover}
            alt=""
            sizes="(min-width: 768px) 33vw, 100vw"
            className="size-full transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <NoPhoto label="Photos to follow" />
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge tone={p.stage === "completed" ? "dark" : "bronze"}>{PROJECT_STAGE_LABEL[p.stage]}</Badge>
          {p.isSample ? <SampleBadge /> : null}
        </div>
      </div>
      <p className="text-eyebrow mt-4 text-bronze-ink">
        {PROJECT_TYPE_LABEL[p.type]}
        {p.completionYear ? ` · ${p.completionYear}` : ""}
      </p>
      <h3 className="text-h3 mt-2">
        <Link href={`/projects/${p.slug}`} className="after:absolute after:inset-0 hover:underline">
          {p.title}
        </Link>
      </h3>
      {p.localityName ? <p className="mt-1 text-sm text-ink-muted">{p.localityName}</p> : null}
      {p.summary ? <p className="mt-2 line-clamp-3 text-ink-muted">{p.summary}</p> : null}
    </article>
  );
}
