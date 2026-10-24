import type { ReactNode } from "react";
import { Badge } from "@/components/ui/feedback";
import {
  AVAILABILITY_LABEL,
  ENQUIRY_STATUS_LABEL,
  PUBLICATION_LABEL,
  type Availability,
  type EnquiryStatus,
  type PublicationStatus,
} from "@/lib/domain";
import { Breadcrumbs, type Crumb } from "@/components/ui/layout";

export function AdminHeader({
  title,
  description,
  actions,
  crumbs,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: Crumb[];
}) {
  return (
    <div className="mb-6 md:mb-8">
      {crumbs ? <Breadcrumbs items={crumbs} className="mb-3" /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight md:text-[1.75rem]">{title}</h1>
          {description ? <div className="mt-1 text-ink-muted">{description}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Panel({ title, description, children, actions }: { title?: ReactNode; description?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-md border border-line bg-surface">
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PublicationBadge({ status }: { status: PublicationStatus }) {
  const tone = status === "published" ? "success" : status === "draft" ? "warning" : "neutral";
  return (
    <Badge tone={tone}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {PUBLICATION_LABEL[status]}
    </Badge>
  );
}

export function AvailabilityBadge({ value }: { value: Availability }) {
  return <Badge tone={value === "available" ? "info" : value === "under_offer" ? "warning" : "neutral"}>{AVAILABILITY_LABEL[value]}</Badge>;
}

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  const tone =
    status === "new" ? "danger" : status === "qualified" ? "success" : status === "closed" || status === "spam" ? "neutral" : "info";
  return <Badge tone={tone}>{ENQUIRY_STATUS_LABEL[status]}</Badge>;
}

export function Stat({ label, value, href, hint }: { label: string; value: number; href?: string; hint?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </>
  );
  return href ? (
    <a href={href} className="block rounded-md border border-line bg-surface p-5 hover:border-ink">
      {body}
    </a>
  ) : (
    <div className="rounded-md border border-line bg-surface p-5">{body}</div>
  );
}
