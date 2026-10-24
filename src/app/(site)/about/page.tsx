import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/layout";
import { getPublicSettings } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "About HKNR",
  description: "HKNR is a real estate and construction business based in Moula Ali, Secunderabad, Hyderabad.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const s = await getPublicSettings();
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "About" }]}
        eyebrow="About"
        title="A local property and construction business"
        intro="HKNR is based in Moula Ali, Secunderabad, and works with people buying, selling and building property in the area."
      />
      <div className="container-page grid gap-12 py-12 md:py-16 lg:grid-cols-[1fr_22rem]">
        <div className="prose-body text-lg leading-relaxed">
          {s.aboutText ? (
            <div className="whitespace-pre-line">{s.aboutText}</div>
          ) : (
            <>
              <p>
                We help people buy and sell plots, independent houses and apartments in and around Moula Ali, and we take on
                construction work for owners who want to build on their own land.
              </p>
              <p>
                On this website you&apos;ll find our current listings, each with a reference number, measurements in the units
                they&apos;re normally quoted in, and its current availability. If something isn&apos;t clear, ask us. We would
                rather answer a question than have you guess.
              </p>
            </>
          )}
          <h2 className="text-h2 mt-12">How we work with you</h2>
          <ul className="mt-5 space-y-4">
            {[
              ["Clear listings", "Prices, areas and status are shown as they are. Where a price isn't published, the listing says so."],
              ["Your details stay with us", "Enquiry details are used to reply to you, not shared or sold."],
              ["No pressure", "Ask about a property or a building project without any obligation."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-4">
                <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 bg-bronze" />
                <span>
                  <strong className="font-semibold">{t}.</strong> {d}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="space-y-4 lg:self-start">
          <div className="rounded-md border border-line bg-ivory p-6">
            <h2 className="text-eyebrow text-bronze-ink">Where we are</h2>
            <p className="mt-3 text-lg">{s.address ?? "Moula Ali, Secunderabad, Hyderabad, Telangana"}</p>
            {s.openingHours ? <p className="mt-3 whitespace-pre-line text-ink-muted">{s.openingHours}</p> : null}
            {s.registrationsText ? <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">{s.registrationsText}</p> : null}
          </div>
          <ButtonLink href="/contact" size="lg" className="w-full">
            Get in touch
          </ButtonLink>
        </aside>
      </div>
    </>
  );
}
