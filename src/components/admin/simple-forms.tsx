"use client";

import { useRef } from "react";
import { changePassword } from "@/app/admin/actions/auth";
import { saveHeroAlt, saveLocality, saveService, saveSettings } from "@/app/admin/actions/content";
import { createUser, resetUserPassword } from "@/app/admin/actions/people";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { PUBLICATION_LABEL, PUBLICATION_STATUSES, USER_ROLE_LABEL, USER_ROLES } from "@/lib/domain";
import { formatPhoneDisplay } from "@/lib/format";
import { FormResult, useAdminForm, useUnsavedGuard } from "./form-bits";

/* -------------------------------------------------------------- services */

export function ServiceForm({
  id,
  initial,
}: {
  id: string | null;
  initial?: { title: string; summary: string; body: string; sortOrder: number; status: string };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, onSubmit, pending] = useAdminForm(async (prev, data) => {
    const r = await saveService(id, prev, data);
    if (r.ok && !id) formRef.current?.reset();
    return r;
  });
  const e = state.fieldErrors ?? {};
  const p = id ?? "new";
  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 md:grid-cols-[1fr_10rem_8rem]">
      <Field id={`${p}-title`} label="Title" error={e.title}>
        {(a) => <Input {...a} name="title" maxLength={100} defaultValue={initial?.title} />}
      </Field>
      <Field id={`${p}-status`} label="Status" error={e.status}>
        {(a) => (
          <Select {...a} name="status" defaultValue={initial?.status ?? "draft"}>
            {PUBLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PUBLICATION_LABEL[s]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field id={`${p}-order`} label="Order" error={e.sortOrder}>
        {(a) => <Input {...a} name="sortOrder" type="number" min={0} defaultValue={initial?.sortOrder ?? 0} />}
      </Field>
      <Field id={`${p}-summary`} label="Summary" hint="One line shown in lists" error={e.summary} className="md:col-span-3">
        {(a) => <Input {...a} name="summary" maxLength={300} defaultValue={initial?.summary} />}
      </Field>
      <Field id={`${p}-body`} label="Details" optional error={e.body} className="md:col-span-3">
        {(a) => <Textarea {...a} name="body" rows={3} maxLength={4000} defaultValue={initial?.body} />}
      </Field>
      <div className="flex flex-col gap-3 md:col-span-3">
        <FormResult state={state} />
        <div>
          <Button type="submit" variant={id ? "secondary" : "primary"} pending={pending}>
            {id ? "Save" : "Add service"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------ localities */

export function LocalityForm({ id, initial }: { id: string | null; initial?: { name: string; sortOrder: number } }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, onSubmit, pending] = useAdminForm(async (prev, data) => {
    const r = await saveLocality(id, prev, data);
    if (r.ok && !id) formRef.current?.reset();
    return r;
  });
  const e = state.fieldErrors ?? {};
  const p = id ?? "new";
  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_6rem_auto]">
        <Field id={`${p}-name`} label={id ? "Name" : "New locality"} error={e.name}>
          {(a) => <Input {...a} name="name" maxLength={80} defaultValue={initial?.name} placeholder={id ? undefined : "e.g. Moula Ali"} />}
        </Field>
        <Field id={`${p}-sort`} label="Order" error={e.sortOrder}>
          {(a) => <Input {...a} name="sortOrder" type="number" min={0} defaultValue={initial?.sortOrder ?? 0} />}
        </Field>
        <Button type="submit" variant={id ? "secondary" : "primary"} pending={pending}>
          {id ? "Save" : "Add"}
        </Button>
      </div>
      <FormResult state={state} />
    </form>
  );
}

/* -------------------------------------------------------------- settings */

export type SettingsValues = {
  legalName: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  notificationEmail: string | null;
  addressLine: string | null;
  showAddress: boolean;
  openingHours: string | null;
  mapUrl: string | null;
  socials: { instagram?: string; facebook?: string; youtube?: string; googleBusiness?: string };
  aboutText: string | null;
  registrationsText: string | null;
};

function SettingsGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-md border border-line bg-surface p-5 md:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-base font-bold" aria-hidden="true">
        {title}
      </h2>
      {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
      <div className="mt-5 grid gap-5 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function SettingsForm({ initial }: { initial: SettingsValues | null }) {
  const [state, onSubmit, pending] = useAdminForm(saveSettings);
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = useUnsavedGuard(formRef, state.ok);
  const e = state.fieldErrors ?? {};
  const v = initial;
  const phoneDefault = (x: string | null | undefined) => (x ? formatPhoneDisplay(x) : "");
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormResult state={state} />
      <SettingsGroup
        title="Contact details"
        description="Only enter verified details. Empty fields are hidden on the website, and the matching buttons don't appear."
      >
        <Field id="phone" label="Phone number" hint="Used for “Call” buttons" error={e.phone}>
          {(a) => <Input {...a} name="phone" type="tel" defaultValue={phoneDefault(v?.phone)} />}
        </Field>
        <Field id="whatsapp" label="WhatsApp number" hint="Used for “WhatsApp” buttons. Can be the same number." error={e.whatsapp}>
          {(a) => <Input {...a} name="whatsapp" type="tel" defaultValue={phoneDefault(v?.whatsapp)} />}
        </Field>
        <Field id="email" label="Public email" error={e.email}>
          {(a) => <Input {...a} name="email" type="email" defaultValue={v?.email ?? ""} />}
        </Field>
        <Field id="notificationEmail" label="Send new enquiries to" hint="Internal. Not shown on the website." error={e.notificationEmail}>
          {(a) => <Input {...a} name="notificationEmail" type="email" defaultValue={v?.notificationEmail ?? ""} />}
        </Field>
        <Field id="addressLine" label="Office address" error={e.addressLine} className="md:col-span-2">
          {(a) => <Textarea {...a} name="addressLine" rows={2} defaultValue={v?.addressLine ?? ""} />}
        </Field>
        <Checkbox id="showAddress" name="showAddress" defaultChecked={v?.showAddress} label="Show the address publicly" />
        <Field id="mapUrl" label="Google Maps link" optional error={e.mapUrl}>
          {(a) => <Input {...a} name="mapUrl" type="url" defaultValue={v?.mapUrl ?? ""} />}
        </Field>
        <Field id="openingHours" label="Opening hours" optional hint="e.g. Mon–Sat, 10:00–19:00" error={e.openingHours} className="md:col-span-2">
          {(a) => <Textarea {...a} name="openingHours" rows={2} defaultValue={v?.openingHours ?? ""} />}
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Business identity">
        <Field id="legalName" label="Business name for footer and legal pages" optional hint="Exactly as registered" error={e.legalName}>
          {(a) => <Input {...a} name="legalName" defaultValue={v?.legalName ?? ""} />}
        </Field>
        <Field id="registrationsText" label="Registrations shown in footer" optional hint="e.g. TS-RERA agent registration number" error={e.registrationsText}>
          {(a) => <Input {...a} name="registrationsText" defaultValue={v?.registrationsText ?? ""} />}
        </Field>
        <Field id="aboutText" label="About page text" optional hint="Replaces the default About text. Only verifiable facts." error={e.aboutText} className="md:col-span-2">
          {(a) => <Textarea {...a} name="aboutText" rows={6} defaultValue={v?.aboutText ?? ""} />}
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Social profiles" description="Full links starting with https://">
        {(["instagram", "facebook", "youtube", "googleBusiness"] as const).map((k) => (
          <Field key={k} id={k} label={k === "googleBusiness" ? "Google Business Profile" : k[0].toUpperCase() + k.slice(1)} optional error={e[k]}>
            {(a) => <Input {...a} name={k} type="url" defaultValue={v?.socials?.[k] ?? ""} />}
          </Field>
        ))}
      </SettingsGroup>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" pending={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {dirty ? <span className="text-sm text-warning">Unsaved changes</span> : null}
      </div>
    </form>
  );
}

export function HeroAltForm({ initial }: { initial: string }) {
  const [state, onSubmit, pending] = useAdminForm(saveHeroAlt);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <Field id="heroAlt" label="Describe the photo" hint="For screen readers, e.g. “Completed G+1 house in Moula Ali”">
        {(a) => <Input {...a} name="altText" maxLength={200} defaultValue={initial} />}
      </Field>
      <FormResult state={state} />
      <div>
        <Button type="submit" variant="secondary" size="sm" pending={pending}>
          Save description
        </Button>
      </div>
    </form>
  );
}

/* ----------------------------------------------------------------- users */

export function UserCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, onSubmit, pending] = useAdminForm(async (prev, data) => {
    const r = await createUser(prev, data);
    if (r.ok) formRef.current?.reset();
    return r;
  });
  const e = state.fieldErrors ?? {};
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-4 md:grid-cols-2">
      <Field id="u-name" label="Name" error={e.name}>
        {(a) => <Input {...a} name="name" autoComplete="off" />}
      </Field>
      <Field id="u-email" label="Email" error={e.email}>
        {(a) => <Input {...a} name="email" type="email" autoComplete="off" />}
      </Field>
      <Field id="u-role" label="Role" hint="Staff manage listings and enquiries. Administrators can also change settings and accounts." error={e.role}>
        {(a) => (
          <Select {...a} name="role" defaultValue="staff">
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {USER_ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field id="u-password" label="Temporary password" hint="At least 12 characters. Ask them to change it after signing in." error={e.password}>
        {(a) => <Input {...a} name="password" type="text" autoComplete="new-password" />}
      </Field>
      <div className="flex flex-col gap-3 md:col-span-2">
        <FormResult state={state} />
        <div>
          <Button type="submit" pending={pending}>
            Create account
          </Button>
        </div>
      </div>
    </form>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, onSubmit, pending] = useAdminForm(async (prev, data) => {
    const r = await resetUserPassword(userId, prev, data);
    if (r.ok) formRef.current?.reset();
    return r;
  });
  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Field id={`pw-${userId}`} label="New password" error={state.fieldErrors?.password} className="flex-1">
          {(a) => <Input {...a} name="password" type="text" autoComplete="new-password" className="min-h-10" />}
        </Field>
        <Button type="submit" variant="secondary" size="sm" pending={pending} className="min-h-10">
          Reset password
        </Button>
      </div>
      <FormResult state={{ ok: state.ok, error: state.error }} />
    </form>
  );
}

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, onSubmit, pending] = useAdminForm(async (prev, data) => {
    const r = await changePassword(prev, data);
    if (r.ok) formRef.current?.reset();
    return r;
  });
  const e = state.fieldErrors ?? {};
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex max-w-md flex-col gap-4">
      <Field id="current" label="Current password" error={e.current}>
        {(a) => <Input {...a} name="current" type="password" autoComplete="current-password" />}
      </Field>
      <Field id="next" label="New password" hint="At least 12 characters. A short phrase works well." error={e.next}>
        {(a) => <Input {...a} name="next" type="password" autoComplete="new-password" />}
      </Field>
      <Field id="confirm" label="Confirm new password" error={e.confirm}>
        {(a) => <Input {...a} name="confirm" type="password" autoComplete="new-password" />}
      </Field>
      <FormResult state={state} />
      <div>
        <Button type="submit" pending={pending}>
          Change password
        </Button>
      </div>
    </form>
  );
}
