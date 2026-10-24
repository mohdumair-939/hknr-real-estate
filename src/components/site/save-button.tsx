"use client";

import { Heart } from "lucide-react";
import { useEffect } from "react";
import { recordView, toggleSaved, useIdList } from "@/lib/browser-store";
import { cn } from "@/lib/cn";

export function SaveButton({ id, title, withLabel = false }: { id: string; title: string; withLabel?: boolean }) {
  const saved = useIdList("saved").includes(id);
  return (
    <button
      type="button"
      onClick={() => toggleSaved(id)}
      aria-pressed={saved}
      aria-label={withLabel ? undefined : saved ? `Remove “${title}” from saved` : `Save “${title}”`}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors",
        withLabel ? "border border-line-strong bg-surface px-4 hover:bg-sunken" : "size-11 hover:bg-sunken",
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn("size-5 transition-colors", saved ? "fill-danger text-danger" : "text-ink-muted")}
      />
      {withLabel ? (saved ? "Saved" : "Save") : null}
    </button>
  );
}

/** Adds the current property to "recently viewed". Renders nothing. */
export function RecordView({ id }: { id: string }) {
  useEffect(() => recordView(id), [id]);
  return null;
}
