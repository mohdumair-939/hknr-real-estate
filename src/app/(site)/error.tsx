"use client";

import { Button, ButtonLink } from "@/components/ui/button";

/** Shown when a public page fails to render. Never displays internal error details. */
export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-20">
      <p className="text-eyebrow text-bronze-ink">Something didn&apos;t load</p>
      <h1 className="text-h1 mt-3 max-w-xl">This page couldn&apos;t be loaded right now.</h1>
      <p className="mt-4 max-w-lg text-lg text-ink-muted">
        This is usually temporary. Try again, or come back in a few minutes. If you were sending an enquiry, check whether you
        saw a confirmation with a reference number before sending it again.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Home page
        </ButtonLink>
      </div>
    </div>
  );
}
