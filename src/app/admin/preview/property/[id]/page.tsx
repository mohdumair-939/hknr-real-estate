import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyDetail } from "@/components/site/property-detail";
import { getPropertyPreview } from "@/lib/admin/queries";
import { requireUser } from "@/lib/auth/dal";
import { PUBLICATION_LABEL } from "@/lib/domain";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };
export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Shows a listing exactly as the public page renders it, whatever its publication state. */
export default async function PreviewProperty(props: PageProps<"/admin/preview/property/[id]">) {
  await requireUser();
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const p = await getPropertyPreview(id);
  if (!p) notFound();
  return (
    <>
      <div className="sticky top-0 z-(--z-header) flex flex-wrap items-center justify-between gap-3 bg-warning px-4 py-2.5 text-sm font-semibold text-white">
        <span>
          Preview · {PUBLICATION_LABEL[p.status]} — {p.status === "published" ? "this is what visitors see." : "visitors can't see this yet."}
        </span>
        <Link href={`/admin/properties/${p.id}`} className="underline underline-offset-4">
          Back to editing
        </Link>
      </div>
      <main className="py-4">
        <PropertyDetail p={p} preview />
      </main>
    </>
  );
}
