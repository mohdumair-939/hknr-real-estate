import type { Metadata } from "next";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { PageHeader } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Sell your property with HKNR",
  description: "Own a plot, house or apartment in or around Moula Ali? Tell HKNR about it and we'll get in touch to discuss selling.",
  alternates: { canonical: "/sell" },
};

export default function SellPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Sell your property" }]}
        eyebrow="For owners"
        title="Sell your property with HKNR"
        intro="Tell us about your plot, house or apartment. We'll contact you to talk through the details. Sending this form doesn't commit you to anything."
      />
      <div className="container-page grid gap-12 py-12 md:py-16 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="sell-form" className="max-w-2xl">
          <h2 id="sell-form" className="text-h2">
            About your property
          </h2>
          <p className="mt-2 text-ink-muted">A few lines is enough: type, locality, approximate size and when you&apos;d like to sell.</p>
          <div className="mt-6">
            <EnquiryForm
              category="sell"
              idPrefix="sell"
              messagePlaceholder="e.g. 167 sq yd east-facing plot in Moula Ali, HMDA approved. Looking to sell in the next 3 months."
              submitLabel="Send property details"
            />
          </div>
        </section>
        <aside className="lg:self-start">
          <div className="rounded-md border border-line bg-ivory p-6">
            <h2 className="text-h3">What happens next</h2>
            <ol className="mt-4 space-y-4">
              {[
                "We read your details and call or message you using your preferred method.",
                "We talk through the property, its documents and your expectations.",
                "If we agree to work together, we prepare the listing with you, including photos and measurements.",
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display text-xl text-bronze-ink" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </>
  );
}
