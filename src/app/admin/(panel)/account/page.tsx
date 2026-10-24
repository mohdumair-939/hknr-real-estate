import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/admin/simple-forms";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/dal";
import { USER_ROLE_LABEL } from "@/lib/domain";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const me = await requireUser();
  return (
    <div className="max-w-2xl space-y-6">
      <AdminHeader title="Your account" description={`${me.name} · ${me.email} · ${USER_ROLE_LABEL[me.role]}`} />
      <Panel title="Change password" description="Changing your password signs you out on every other device.">
        <ChangePasswordForm />
      </Panel>
    </div>
  );
}
