import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/layout";
import { getPublicSettings } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms for using the HKNR website.",
  alternates: { canonical: "/terms" },
};

// Draft for business/legal review (see docs/business-content-checklist.md).
export default async function TermsPage() {
  const s = await getPublicSettings();
  const owner = s.legalName ?? "HKNR";
  return (
    <>
      <PageHeader crumbs={[{ href: "/", label: "Home" }, { label: "Terms" }]} title="Terms of use" intro="Last updated October 2026." />
      <div className="container-page py-12">
        <div className="prose-body space-y-8 text-[1.0625rem] leading-relaxed [&_h2]:text-h3 [&_h2]:mb-2">
          <section>
            <h2>About listings</h2>
            <p>
              Listings on this website are provided for information. Prices, measurements, availability and other details can
              change and may contain errors. A listing is not an offer or a contract. Please confirm all details, documents and
              approvals independently before making any decision or payment.
            </p>
          </section>
          <section>
            <h2>Photographs and content</h2>
            <p>
              Photographs, text and other content on this website belong to {owner} or are used with permission. Please
              don&apos;t copy them for commercial use without asking.
            </p>
          </section>
          <section>
            <h2>Enquiries</h2>
            <p>
              Sending an enquiry doesn&apos;t create any obligation for you or for {owner}. Please don&apos;t send misleading,
              abusive or automated submissions.
            </p>
          </section>
          <section>
            <h2>Links</h2>
            <p>Links to other websites (such as WhatsApp or maps) are provided for convenience; we aren&apos;t responsible for their content.</p>
          </section>
          <section>
            <h2>Governing law</h2>
            <p>These terms are governed by the laws of India. Courts in Hyderabad, Telangana have jurisdiction.</p>
          </section>
        </div>
      </div>
    </>
  );
}
