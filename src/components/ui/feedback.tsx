import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger" | "neutral";

const alertTone: Record<Tone, string> = {
  info: "border-info/30 bg-info-soft text-info",
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/30 bg-danger-soft text-danger",
  neutral: "border-line bg-sunken text-ink",
};

const icons: Record<Tone, ReactNode> = {
  info: <path d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm.9 13.25H9.1v-5.5h1.8v5.5ZM10 7.75a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />,
  success: <path d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm-1.3 12.2-3.6-3.6 1.3-1.3 2.3 2.3 4.8-4.8 1.3 1.3-6.1 6.1Z" />,
  warning: <path d="M10.9 2.6a1 1 0 0 0-1.8 0l-7.5 13.5A1 1 0 0 0 2.5 17.6h15a1 1 0 0 0 .9-1.5L10.9 2.6M10.9 15H9.1v-1.8h1.8V15Zm0-3.2H9.1V7.2h1.8v4.6Z" />,
  danger: <path d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm-.9 4.25h1.8v5.5H9.1v-5.5Zm.9 9a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />,
  neutral: <path d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm.9 13.25H9.1v-5.5h1.8v5.5ZM10 7.75a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />,
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  role,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  return (
    <div role={role} className={cn("flex gap-3 rounded-md border px-4 py-3 text-sm", alertTone[tone], className)}>
      <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 size-5 shrink-0" fill="currentColor">
        {icons[tone]}
      </svg>
      <div className="min-w-0 space-y-1 text-ink">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-ink">{children}</div> : null}
      </div>
    </div>
  );
}

const badgeTone: Record<Tone | "dark" | "bronze", string> = {
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-sunken text-ink",
  dark: "bg-charcoal text-ivory",
  bronze: "bg-ivory text-bronze-ink",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof badgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs px-2 py-0.5 text-xs font-semibold tracking-wide whitespace-nowrap",
        badgeTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Marks synthetic development content so it can never be mistaken for a real listing. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <Badge tone="warning" className={cn("border border-warning/40 uppercase", className)}>
      Sample data
    </Badge>
  );
}

export function EmptyState({
  title,
  children,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-line-strong/60 bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-4 text-bronze-ink [&_svg]:size-8">{icon}</div> : null}
      <h2 className="text-h3 text-ink">{title}</h2>
      {children ? <div className="mt-2 max-w-md text-ink-muted">{children}</div> : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
