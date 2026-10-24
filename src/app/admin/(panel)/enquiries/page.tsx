import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, EnquiryStatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/feedback";
import { activeStaff, listEnquiries, type EnquiryListFilters } from "@/lib/admin/queries";
import { requireUser } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";
import {
  ENQUIRY_CATEGORIES,
  ENQUIRY_CATEGORY_LABEL,
  ENQUIRY_STATUSES,
  type EnquiryCategory,
  type EnquiryStatus,
} from "@/lib/domain";
import { formatDateTime, formatPhoneDisplay } from "@/lib/format";

export const metadata: Metadata = { title: "Enquiries" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function EnquiriesPage(props: PageProps<"/admin/enquiries">) {
  const [me, sp, staff] = await Promise.all([requireUser(), props.searchParams, activeStaff()]);
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const statusRaw = one(sp.status);
  const status: EnquiryListFilters["status"] =
    statusRaw === "all" || ENQUIRY_STATUSES.includes(statusRaw as EnquiryStatus) ? (statusRaw as EnquiryListFilters["status"]) : "open";
  const categoryRaw = one(sp.category);
  const category = ENQUIRY_CATEGORIES.includes(categoryRaw as EnquiryCategory) ? (categoryRaw as EnquiryCategory) : undefined;
  const assigneeRaw = one(sp.assignee);
  const assignee = assigneeRaw === "me" || assigneeRaw === "none" || (assigneeRaw && UUID.test(assigneeRaw)) ? assigneeRaw : undefined;
  const q = one(sp.q)?.slice(0, 80);
  const page = Math.max(1, Math.min(1000, Number(one(sp.page)) || 1));

  const { rows, total, pageCount } = await listEnquiries({ status, category, assignee, q, page }, me.id);
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status: status === "open" ? undefined : status, category, assignee, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/enquiries${s ? `?${s}` : ""}`;
  };

  const tabs: { label: string; value: EnquiryListFilters["status"] }[] = [
    { label: "Open", value: "open" },
    { label: "New", value: "new" },
    { label: "Follow-up", value: "follow_up" },
    { label: "Qualified", value: "qualified" },
    { label: "Closed", value: "closed" },
    { label: "Spam", value: "spam" },
    { label: "All", value: "all" },
  ];

  return (
    <>
      <AdminHeader title="Enquiries" description={`${total} ${total === 1 ? "enquiry" : "enquiries"} in this view`} />

      <nav aria-label="Filter by status" className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={qs({ status: t.value === "open" ? undefined : t.value, page: undefined })}
            aria-current={status === t.value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold whitespace-nowrap",
              status === t.value ? "bg-charcoal text-ivory" : "text-ink-muted hover:bg-sunken",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <form className="mb-5 grid gap-3 rounded-md border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_auto]" role="search">
        {status !== "open" ? <input type="hidden" name="status" value={status} /> : null}
        <div>
          <label htmlFor="eq" className="mb-1 block text-sm font-semibold">
            Search
          </label>
          <Input id="eq" name="q" type="search" defaultValue={q} placeholder="Name, phone, email or reference" className="min-h-10" />
        </div>
        <div>
          <label htmlFor="ec" className="mb-1 block text-sm font-semibold">
            Category
          </label>
          <Select id="ec" name="category" defaultValue={category ?? ""} className="min-h-10">
            <option value="">All categories</option>
            {ENQUIRY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ENQUIRY_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="ea" className="mb-1 block text-sm font-semibold">
            Assigned to
          </label>
          <Select id="ea" name="assignee" defaultValue={assignee ?? ""} className="min-h-10">
            <option value="">Anyone</option>
            <option value="me">Me</option>
            <option value="none">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="secondary" className="min-h-10">
            Apply
          </Button>
          {q || category || assignee ? (
            <Link href={qs({ q: undefined, category: undefined, assignee: undefined })} className="inline-flex min-h-10 items-center px-2 text-sm font-semibold underline">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No enquiries in this view">
          {status === "open" && !q ? "New enquiries from the website will appear here." : "Try another status or clear the search."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
          {rows.map((e) => (
            <li key={e.id}>
              <Link
                href={`/admin/enquiries/${e.id}`}
                className={cn(
                  "grid gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-canvas md:grid-cols-[7rem_1fr_10rem_8rem_9rem] md:items-center",
                  e.status === "new" && "bg-danger-soft/40",
                )}
              >
                <span className="text-sm text-ink-muted">{e.reference}</span>
                <span className="min-w-0">
                  <span className="block font-semibold">{e.name}</span>
                  <span className="block truncate text-sm text-ink-muted">
                    {ENQUIRY_CATEGORY_LABEL[e.category]}
                    {e.subject ? ` · ${e.subject}` : ""}
                  </span>
                </span>
                <span className="truncate text-sm">{e.phone ? formatPhoneDisplay(e.phone) : e.email}</span>
                <span className="flex flex-wrap gap-1">
                  <EnquiryStatusBadge status={e.status} />
                </span>
                <span className="text-xs text-ink-muted">
                  {formatDateTime(e.createdAt)}
                  {e.assigneeName ? <span className="block">→ {e.assigneeName}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          {page > 1 ? (
            <Link href={qs({ page: String(page - 1) })} className="font-semibold underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-ink-muted">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={qs({ page: String(page + 1) })} className="font-semibold underline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
