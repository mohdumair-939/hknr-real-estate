import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin/shell";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db/client";
import { enquiries } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · HKNR Admin" },
  robots: { index: false, follow: false },
};

// Admin pages are per-user and must always be fresh, so they render at request time.
export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [{ n }] = await db.select({ n: count() }).from(enquiries).where(eq(enquiries.status, "new"));
  return (
    <AdminShell user={{ name: user.name, role: user.role }} newLeads={n}>
      {children}
    </AdminShell>
  );
}
