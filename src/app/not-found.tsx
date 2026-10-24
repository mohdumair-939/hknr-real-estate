import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/site/brand";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      <header className="container-page flex h-(--header-h) items-center">
        <Wordmark />
      </header>
      <main id="main" className="container-page flex flex-1 flex-col justify-center py-16">
        <p className="text-eyebrow text-bronze-ink">Error 404</p>
        <h1 className="text-h1 mt-3 max-w-xl">We couldn&apos;t find that page.</h1>
        <p className="mt-4 max-w-lg text-lg text-ink-muted">
          The link may be out of date, or the listing may have been removed after it was sold or withdrawn.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/properties">Browse current properties</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Go to the home page
          </ButtonLink>
        </div>
        <p className="mt-8 text-sm text-ink-muted">
          Looking for something specific?{" "}
          <Link href="/contact" className="font-semibold text-ink underline underline-offset-4">
            Ask us
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
