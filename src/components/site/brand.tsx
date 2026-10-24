import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Typographic wordmark. Placeholder until HKNR supplies approved logo files
 * (see docs/business-content-checklist.md); swap the contents of this component only.
 */
export function Wordmark({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex min-h-11 items-center gap-3", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-9 place-items-center rounded-xs border font-display text-[1.05rem] leading-none",
          inverse ? "border-bronze text-ivory" : "border-charcoal bg-charcoal text-ivory",
        )}
      >
        H
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-[1.45rem] tracking-[0.08em]", inverse ? "text-ivory" : "text-ink")}>
          HKNR
        </span>
        <span
          className={cn(
            "mt-1 hidden text-[0.625rem] font-semibold tracking-[0.18em] whitespace-nowrap uppercase min-[400px]:block",
            inverse ? "text-bronze-light" : "text-bronze-ink",
          )}
        >
          Real Estate · Construction
        </span>
        <span className="sr-only"> — home page</span>
      </span>
    </Link>
  );
}
