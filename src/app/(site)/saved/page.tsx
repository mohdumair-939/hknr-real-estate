import { Heart } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PropertyGrid, PropertyGridSkeleton } from "@/components/site/property-card";
import { ClearListButton, SavedSync } from "@/components/site/saved-sync";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/layout";
import { getPropertyCardsByIds } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Saved properties",
  robots: { index: false, follow: true },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function ids(v: string | string[] | undefined): string[] {
  const raw = Array.isArray(v) ? v[0] : v;
  return (raw ?? "").split(",").filter((x) => UUID.test(x)).slice(0, 24);
}

export default function SavedPage(props: PageProps<"/saved">) {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Saved properties" }]}
        title="Saved properties"
        intro="Properties you've saved or looked at recently. This list is stored only in this browser. There's no account, and we don't receive it."
      />
      <div className="container-page py-12">
        <Suspense fallback={<PropertyGridSkeleton count={3} />}>
          <SavedSync />
          <SavedLists searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function SavedLists({ searchParams }: { searchParams: PageProps<"/saved">["searchParams"] }) {
  const sp = await searchParams;
  const [saved, recent] = await Promise.all([getPropertyCardsByIds(ids(sp.saved)), getPropertyCardsByIds(ids(sp.recent))]);
  const recentOnly = recent.filter((r) => !saved.some((s) => s.id === r.id));

  if (!saved.length && !recentOnly.length) {
    return (
      <EmptyState
        icon={<Heart aria-hidden="true" />}
        title="Nothing saved yet"
        action={<ButtonLink href="/properties">Browse properties</ButtonLink>}
      >
        Tap the heart on any listing to keep it here for later.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-16">
      {saved.length ? (
        <section aria-labelledby="saved-h">
          <div className="flex items-center justify-between gap-4">
            <h2 id="saved-h" className="text-h2">
              Saved ({saved.length})
            </h2>
            <ClearListButton list="saved" label="Clear saved" />
          </div>
          <div className="mt-6">
            <PropertyGrid items={saved} />
          </div>
        </section>
      ) : null}
      {recentOnly.length ? (
        <section aria-labelledby="recent-h">
          <div className="flex items-center justify-between gap-4">
            <h2 id="recent-h" className="text-h2">
              Recently viewed
            </h2>
            <ClearListButton list="recent" label="Clear history" />
          </div>
          <div className="mt-6">
            <PropertyGrid items={recentOnly} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
