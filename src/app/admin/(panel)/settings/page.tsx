import type { Metadata } from "next";
import { removeHeroImage } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/form-bits";
import { Uploader } from "@/components/admin/photo-manager";
import { HeroAltForm, SettingsForm } from "@/components/admin/simple-forms";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { getSettings } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/dal";
import { mediaUrl } from "@/lib/storage/public-url";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const s = await getSettings();
  const hero = s?.heroImage ?? null;
  return (
    <div className="max-w-4xl space-y-6">
      <AdminHeader title="Website settings" description="Business details shown across the website." />

      <Panel
        title="Home page image"
        description="A genuine photograph of HKNR's work or office, landscape, at least 1600 px wide. Without one, the home page shows a drawn illustration."
        actions={
          hero ? (
            <ActionButton
              action={removeHeroImage}
              variant="ghost"
              confirm={{ title: "Remove the home page image?", body: "The drawn illustration will be shown instead." }}
              confirmLabel="Remove"
            >
              Remove
            </ActionButton>
          ) : null
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of a pre-generated variant
            <img src={mediaUrl(hero.storageKey, hero.variants[0])} alt="" className="aspect-[4/3] w-full rounded-sm object-cover" />
          ) : null}
          <div className="space-y-4">
            <Uploader owner="hero" id={null} multiple={false} label={hero ? "Replace image" : "Upload image"} />
            {hero ? <HeroAltForm initial={hero.altText} /> : null}
          </div>
        </div>
      </Panel>

      <SettingsForm initial={s} />
    </div>
  );
}
