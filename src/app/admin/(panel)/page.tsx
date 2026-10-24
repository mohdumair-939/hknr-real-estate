import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, EnquiryStatusBadge, Panel, Stat } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { dashboardStats, getSettings, recentEnquiries } from "@/lib/admin/queries";
import { requireUser } from "@/lib/auth/dal";
import { ENQUIRY_CATEGORY_LABEL } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard(props: PageProps<"/admin">) {
  const [me, stats, recent, settings, sp] = await Promise.all([
    requireUser(),
    dashboardStats(),
    recentEnquiries(),
    getSettings(),
    props.searchParams,
  ]);
  const missing = [
    !settings?.phone && "phone number",
    !settings?.email && "email",
    !settings?.notificationEmail && "notification email",
  ].filter(Boolean) as string[];

  return (
    <>
      <AdminHeader
        title={`Hello, ${me.name.split(" ")[0]}`}
        description="Today's enquiries and listings at a glance."
        actions={<ButtonLink href="/admin/properties/new">Add a property</ButtonLink>}
      />

      {sp.denied ? (
        <Alert tone="warning" className="mb-6" role="alert">
          That page is only available to administrators.
        </Alert>
      ) : null}
      {missing.length && me.role === "admin" ? (
        <Alert tone="warning" title="Contact details not set" className="mb-6">
          The website hides contact buttons until these are filled in: {missing.join(", ")}.{" "}
          <Link href="/admin/settings" className="font-semibold underline underline-offset-4">
            Open settings
          </Link>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="New enquiries" value={stats.newLeads} href="/admin/enquiries?status=new" hint="Not yet contacted" />
        <Stat label="Unassigned open enquiries" value={stats.unassigned} href="/admin/enquiries?assignee=none" />
        <Stat label="Follow-ups due (24 h)" value={stats.followUpsDue} href="/admin/enquiries?status=follow_up" />
        <Stat
          label="Published properties"
          value={stats.properties.published}
          href="/admin/properties?status=published"
          hint={`${stats.properties.draft} draft`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel
          title="Latest enquiries"
          actions={
            <Link href="/admin/enquiries" className="text-sm font-semibold underline underline-offset-4">
              View all
            </Link>
          }
        >
          {recent.length ? (
            <ul className="-my-3 divide-y divide-line">
              {recent.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-canvas">
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold">{e.name}</span>
                      <span className="block truncate text-sm text-ink-muted">
                        {ENQUIRY_CATEGORY_LABEL[e.category]}
                        {e.subject ? ` · ${e.subject}` : ""}
                      </span>
                    </span>
                    <EnquiryStatusBadge status={e.status} />
                    <span className="w-full text-xs text-ink-muted sm:w-auto">{formatDateTime(e.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-muted">No enquiries yet. New ones will appear here as soon as they are submitted.</p>
          )}
        </Panel>

        <Panel title="Content">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Published properties</dt>
              <dd className="font-semibold">{stats.properties.published}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Draft properties</dt>
              <dd className="font-semibold">{stats.properties.draft}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Archived properties</dt>
              <dd className="font-semibold">{stats.properties.archived}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Published projects</dt>
              <dd className="font-semibold">{stats.projects.published}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Draft projects</dt>
              <dd className="font-semibold">{stats.projects.draft}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </>
  );
}
