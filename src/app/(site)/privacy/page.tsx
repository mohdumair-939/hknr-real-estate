import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/layout";
import { getPublicSettings } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How HKNR collects and uses information submitted through this website.",
  alternates: { canonical: "/privacy" },
};

/*
 * Drafted from the website's actual data flows (see docs/security.md). It must be reviewed by
 * the business and, ideally, a lawyer before launch; see docs/business-content-checklist.md.
 */
export default async function PrivacyPage() {
  const s = await getPublicSettings();
  const owner = s.legalName ?? "HKNR";
  return (
    <>
      <PageHeader crumbs={[{ href: "/", label: "Home" }, { label: "Privacy" }]} title="Privacy notice" intro="Last updated October 2026." />
      <div className="container-page py-12">
        <div className="prose-body space-y-8 text-[1.0625rem] leading-relaxed [&_h2]:text-h3 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          <section>
            <h2>Who we are</h2>
            <p>
              This website is operated by {owner}, a real estate and construction business based in Moula Ali, Secunderabad,
              Hyderabad, Telangana. In this notice, &ldquo;we&rdquo; means {owner}.
            </p>
          </section>
          <section>
            <h2>What we collect</h2>
            <p>When you send an enquiry, we collect:</p>
            <ul>
              <li>your name, and your phone number and/or email address;</li>
              <li>how you&apos;d like to be contacted, and your message;</li>
              <li>which property or project you asked about, and the page you sent the enquiry from;</li>
              <li>campaign tags in the link you followed (for example &ldquo;utm_source&rdquo;), if any;</li>
              <li>a one-way, scrambled code derived from your internet address, used only to stop spam and abuse. We do not store your internet address itself.</li>
            </ul>
            <p>
              We don&apos;t ask for sensitive information such as identity documents, bank details or financial data through
              this website.
            </p>
          </section>
          <section>
            <h2>How we use it</h2>
            <p>
              We use your details only to reply to your enquiry and follow up on it. We don&apos;t sell your information,
              and we don&apos;t use it for unrelated marketing.
            </p>
          </section>
          <section>
            <h2>Who can see it</h2>
            <p>
              Your enquiry is visible only to authorised HKNR staff through a password-protected system. It is stored with
              the service providers that run this website (website hosting, database, file storage and, if enabled, email
              delivery), who process it on our behalf.
            </p>
          </section>
          <section>
            <h2>How long we keep it</h2>
            <p>
              We keep enquiries for as long as we need them to deal with your request and any follow-up, and then delete
              them. (Retention period to be confirmed by HKNR.)
            </p>
          </section>
          <section>
            <h2>Cookies and browser storage</h2>
            <p>
              This website doesn&apos;t use advertising or analytics cookies. If you save properties or view listings, that list
              is kept in your own browser&apos;s storage and isn&apos;t sent to us unless you open the Saved page, which uses
              only the property identifiers to display the listings. Staff who sign in to manage the website receive a
              security cookie that keeps them signed in.
            </p>
          </section>
          <section>
            <h2>Your rights</h2>
            <p>
              Under India&apos;s Digital Personal Data Protection Act, 2023, you can ask us to tell you what information we hold
              about you, correct it, or delete it, and you can withdraw your consent to being contacted. To do any of this, or
              to raise a concern, contact us
              {s.email ? (
                <>
                  {" "}
                  at <a href={`mailto:${s.email}`} className="underline underline-offset-4">{s.email}</a> or
                </>
              ) : null}{" "}
              through the{" "}
              <Link href="/contact" className="underline underline-offset-4">
                contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
