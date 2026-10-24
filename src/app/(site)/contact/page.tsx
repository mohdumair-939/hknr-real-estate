import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactActions } from "@/components/site/contact-actions";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { PageHeader } from "@/components/ui/layout";
import { ENQUIRY_CATEGORIES, type EnquiryCategory } from "@/lib/domain";
import { formatPhoneDisplay, telHref } from "@/lib/format";
import { getPublicSettings } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Contact HKNR",
  description: "Contact HKNR in Moula Ali, Secunderabad about buying, selling or building property.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage(props: PageProps<"/contact">) {
  const s = await getPublicSettings();
  const hasDirect = Boolean(s.phone || s.email || s.address || s.openingHours);

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]}
        title="Contact us"
        intro="Send an enquiry and we'll get back to you. Tell us whether you're buying, selling or planning to build."
      />
      <div className="container-page grid gap-12 py-12 md:py-16 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="form-heading" className="max-w-2xl">
          <h2 id="form-heading" className="text-h2">
            Send an enquiry
          </h2>
          <div className="mt-6">
            <Suspense fallback={<EnquiryForm idPrefix="ct" />}>
              <TopicForm searchParams={props.searchParams} />
            </Suspense>
          </div>
        </section>

        <aside aria-labelledby="direct-heading" className="lg:self-start">
          <div className="rounded-md border border-line bg-ivory p-6">
            <h2 id="direct-heading" className="text-h3">
              {hasDirect ? "Contact details" : "Other ways to reach us"}
            </h2>
            {hasDirect ? (
              <ul className="mt-5 space-y-5">
                {s.phone ? (
                  <li className="flex gap-3">
                    <Phone className="mt-1 size-5 shrink-0 text-bronze-ink" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-ink-muted">Phone</p>
                      <a href={telHref(s.phone)} className="text-lg font-semibold hover:underline">
                        {formatPhoneDisplay(s.phone)}
                      </a>
                    </div>
                  </li>
                ) : null}
                {s.email ? (
                  <li className="flex gap-3">
                    <Mail className="mt-1 size-5 shrink-0 text-bronze-ink" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm text-ink-muted">Email</p>
                      <a href={`mailto:${s.email}`} className="font-semibold break-all hover:underline">
                        {s.email}
                      </a>
                    </div>
                  </li>
                ) : null}
                {s.address ? (
                  <li className="flex gap-3">
                    <MapPin className="mt-1 size-5 shrink-0 text-bronze-ink" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-ink-muted">Office</p>
                      <p className="whitespace-pre-line">{s.address}</p>
                      {s.mapUrl ? (
                        <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold underline underline-offset-4">
                          Get directions<span className="sr-only"> (opens Google Maps)</span>
                        </a>
                      ) : null}
                    </div>
                  </li>
                ) : null}
                {s.openingHours ? (
                  <li className="flex gap-3">
                    <Clock className="mt-1 size-5 shrink-0 text-bronze-ink" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-ink-muted">Hours</p>
                      <p className="whitespace-pre-line">{s.openingHours}</p>
                    </div>
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="mt-3 text-ink-muted">
                The enquiry form is the best way to reach us. We&apos;re based in Moula Ali, Secunderabad.
              </p>
            )}
            <ContactActions settings={s} whatsappMessage="Hello HKNR, I have an enquiry." size="md" stacked className="mt-6" />
          </div>
        </aside>
      </div>
    </>
  );
}

async function TopicForm({ searchParams }: { searchParams: PageProps<"/contact">["searchParams"] }) {
  const topic = (await searchParams).topic;
  const category = ENQUIRY_CATEGORIES.includes(topic as EnquiryCategory) ? (topic as EnquiryCategory) : "buy";
  return <EnquiryForm idPrefix="ct" defaultCategory={category} />;
}
