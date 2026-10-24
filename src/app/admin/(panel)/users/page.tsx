import type { Metadata } from "next";
import { setUserActive, setUserRole } from "@/app/admin/actions/people";
import { ActionButton } from "@/components/admin/form-bits";
import { ResetPasswordForm, UserCreateForm } from "@/components/admin/simple-forms";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/feedback";
import { listUsers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/dal";
import { USER_ROLE_LABEL } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Staff accounts" };

export default async function UsersPage() {
  const me = await requireAdmin();
  const rows = await listUsers();
  return (
    <div className="max-w-4xl space-y-6">
      <AdminHeader title="Staff accounts" description="People who can sign in to manage the website. There is no public sign-up." />
      <Panel title="Add an account">
        <UserCreateForm />
      </Panel>
      {rows.map((u) => (
        <Panel
          key={u.id}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {u.name} {u.id === me.id ? <Badge>You</Badge> : null}
              <Badge tone={u.role === "admin" ? "dark" : "neutral"}>{USER_ROLE_LABEL[u.role]}</Badge>
              {!u.isActive ? <Badge tone="danger">Deactivated</Badge> : null}
            </span>
          }
          description={`${u.email} · last sign-in ${u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "never"}`}
        >
          {u.id === me.id ? (
            <p className="text-sm text-ink-muted">Change your own password under Account.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <ActionButton action={setUserRole.bind(null, u.id, u.role === "admin" ? "staff" : "admin")}>
                  Make {u.role === "admin" ? "staff" : "administrator"}
                </ActionButton>
                <ActionButton
                  action={setUserActive.bind(null, u.id, !u.isActive)}
                  variant={u.isActive ? "danger" : "secondary"}
                  confirm={
                    u.isActive
                      ? { title: `Deactivate ${u.name}?`, body: "They will be signed out everywhere and can't sign in until reactivated." }
                      : undefined
                  }
                  confirmLabel="Deactivate"
                >
                  {u.isActive ? "Deactivate" : "Reactivate"}
                </ActionButton>
              </div>
              <ResetPasswordForm userId={u.id} />
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}
