import { Mail, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEnquiry } from "@/app/admin/actions/people";
import { EnquiryStatusForm, NoteForm } from "@/components/admin/enquiry-forms";
import { ActionButton } from "@/components/admin/form-bits";
import { AdminHeader, EnquiryStatusBadge, Panel } from "@/components/admin/ui";
import { ButtonAnchor } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { activeStaff, getEnquiry } from "@/lib/admin/queries";
import { requireUser } from "@/lib/auth/dal";
import { CONTACT_METHOD_LABEL, ENQUIRY_CATEGORY_LABEL } from "@/lib/domain";
import { formatDateTime, formatPhoneDisplay, telHref, whatsappHref } from "@/lib/format";

export const metadata: Metadata = { title: "Enquiry" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function EnquiryDetail(props: PageProps<"/admin/enquiries/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const [me, data, staff] = await Promise.all([requireUser(), getEnquiry(id), activeStaff()]);
  if (!data) notFound();
  const e = data.enquiry;

  return (
    <>
      <AdminHeader
        crumbs={[{ href: "/admin/enquiries", label: "Enquiries" }, { label: e.reference }]}
        title={e.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {e.reference} · {ENQUIRY_CATEGORY_LABEL[e.category]} <EnquiryStatusBadge status={e.status} />
            <span className="text-sm">Received {formatDateTime(e.createdAt)}</span>
          </span>
        }
      />

      {e.notificationStatus === "failed" ? (
        <Alert tone="warning" className="mb-6" title="Email notification failed">
          The enquiry was saved, but the notification email couldn&apos;t be sent ({e.notificationError}). Check email settings.
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Panel title="Contact">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-ink-muted">Prefers</dt>
                <dd className="font-semibold">{CONTACT_METHOD_LABEL[e.preferredContact]}</dd>
              </div>
              {e.phone ? (
                <div>
                  <dt className="text-sm text-ink-muted">Phone</dt>
                  <dd className="font-semibold">{formatPhoneDisplay(e.phone)}</dd>
                </div>
              ) : null}
              {e.email ? (
                <div className="min-w-0">
                  <dt className="text-sm text-ink-muted">Email</dt>
                  <dd className="font-semibold break-all">{e.email}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              {e.phone ? (
                <>
                  <ButtonAnchor href={telHref(e.phone)} variant="secondary" size="sm">
                    <Phone aria-hidden="true" /> Call
                  </ButtonAnchor>
                  <ButtonAnchor
                    href={whatsappHref(e.phone, `Hello ${e.name}, this is HKNR replying to your enquiry ${e.reference}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                    size="sm"
                  >
                    <MessageCircle aria-hidden="true" /> WhatsApp
                  </ButtonAnchor>
                </>
              ) : null}
              {e.email ? (
                <ButtonAnchor href={`mailto:${e.email}?subject=${encodeURIComponent(`Your enquiry ${e.reference}`)}`} variant="secondary" size="sm">
                  <Mail aria-hidden="true" /> Email
                </ButtonAnchor>
              ) : null}
            </div>
          </Panel>

          <Panel title="Message">
            {e.subjectSnapshot ? (
              <p className="mb-3 text-sm">
                <span className="text-ink-muted">About: </span>
                {data.propertyId ? (
                  <Link href={`/admin/properties/${data.propertyId}`} className="font-semibold underline">
                    {e.subjectSnapshot}
                  </Link>
                ) : (
                  <span className="font-semibold">{e.subjectSnapshot}</span>
                )}
              </p>
            ) : null}
            {e.message ? <p className="whitespace-pre-line">{e.message}</p> : <p className="text-ink-muted">No message was written.</p>}
            <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Sent from page</dt>
                <dd>{e.sourcePath ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Campaign</dt>
                <dd>{[e.utmSource, e.utmMedium, e.utmCampaign].filter(Boolean).join(" / ") || "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Consent to contact</dt>
                <dd>{e.consent ? `Given (${e.consentVersion})` : "Not given"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Email notification</dt>
                <dd>{e.notificationStatus}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Notes">
            <NoteForm enquiryId={e.id} />
            {data.notes.length ? (
              <ol className="mt-6 space-y-4 border-t border-line pt-5">
                {data.notes.map((n) => (
                  <li key={n.id}>
                    <p className="text-sm text-ink-muted">
                      {n.author ?? "Former staff member"} · {formatDateTime(n.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-line">{n.body}</p>
                  </li>
                ))}
              </ol>
            ) : null}
          </Panel>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Panel title="Follow-up">
            <EnquiryStatusForm id={e.id} status={e.status} assignedTo={e.assignedTo} nextFollowUpAt={e.nextFollowUpAt} staff={staff} />
            {e.firstRespondedAt ? (
              <p className="mt-4 text-sm text-ink-muted">First response recorded {formatDateTime(e.firstRespondedAt)}.</p>
            ) : null}
          </Panel>
          {me.role === "admin" ? (
            <Panel title="Delete">
              <p className="mb-3 text-sm text-ink-muted">Use this for a privacy deletion request or test data.</p>
              <ActionButton
                action={deleteEnquiry.bind(null, e.id)}
                variant="danger"
                confirm={{ title: `Delete ${e.reference}?`, body: "The enquiry and its notes will be permanently deleted." }}
                confirmLabel="Delete permanently"
              >
                Delete enquiry
              </ActionButton>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
