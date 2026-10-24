"use client";

import Link from "next/link";
import { useRef } from "react";
import type { FormState } from "@/app/admin/actions/_shared";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { PROJECT_STAGES, PROJECT_STAGE_LABEL, PROJECT_TYPES, PROJECT_TYPE_LABEL } from "@/lib/domain";
import { FormResult, useAdminForm, useUnsavedGuard } from "./form-bits";

export type ProjectFormValues = {
  title?: string;
  type?: string;
  stage?: string;
  localityId?: string | null;
  completionYear?: number | null;
  summary?: string;
  description?: string;
  specifications?: { label: string; value: string }[];
  isFeatured?: boolean;
};

export function ProjectForm({
  action,
  initial = {},
  localities,
  submitLabel,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  initial?: ProjectFormValues;
  localities: { id: string; name: string }[];
  submitLabel: string;
}) {
  const [state, onSubmit, pending] = useAdminForm(action);
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = useUnsavedGuard(formRef, state.ok);
  const e = state.fieldErrors ?? {};
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5 rounded-md border border-line bg-surface p-5 md:p-6">
      <FormResult state={state} />
      <Field id="title" label="Project title" hint="e.g. “G+2 independent house, Moula Ali”" error={e.title}>
        {(a) => <Input {...a} name="title" maxLength={140} defaultValue={initial.title} />}
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="type" label="Project type" error={e.type}>
          {(a) => (
            <Select {...a} name="type" defaultValue={initial.type ?? "residential_house"}>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROJECT_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="stage" label="Stage" error={e.stage}>
          {(a) => (
            <Select {...a} name="stage" defaultValue={initial.stage ?? "completed"}>
              {PROJECT_STAGES.map((t) => (
                <option key={t} value={t}>
                  {PROJECT_STAGE_LABEL[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="localityId" label="Locality" optional error={e.localityId}>
          {(a) => (
            <Select {...a} name="localityId" defaultValue={initial.localityId ?? ""}>
              <option value="">Not shown</option>
              {localities.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="completionYear" label="Completion year" optional hint="Only if confirmed" error={e.completionYear}>
          {(a) => <Input {...a} name="completionYear" type="number" inputMode="numeric" min={1950} max={2100} defaultValue={initial.completionYear ?? ""} />}
        </Field>
      </div>
      <Field id="summary" label="Summary" hint="One or two sentences shown on project cards (at least 20 characters to publish)" error={e.summary}>
        {(a) => <Textarea {...a} name="summary" rows={2} maxLength={300} defaultValue={initial.summary} />}
      </Field>
      <Field id="description" label="Description" optional error={e.description}>
        {(a) => <Textarea {...a} name="description" rows={6} maxLength={6000} defaultValue={initial.description} />}
      </Field>
      <Field
        id="specifications"
        label="Specifications"
        optional
        hint="One per line as “Label: value”, e.g. “Plot: 200 sq yd”, “Floors: G+2”"
        error={e.specifications}
      >
        {(a) => (
          <Textarea
            {...a}
            name="specifications"
            rows={5}
            defaultValue={(initial.specifications ?? []).map((s) => (s.value ? `${s.label}: ${s.value}` : s.label)).join("\n")}
          />
        )}
      </Field>
      <Checkbox id="isFeatured" name="isFeatured" defaultChecked={initial.isFeatured} label="Feature on the home page" />
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" pending={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link href="/admin/projects" className="inline-flex min-h-11 items-center px-3 font-semibold text-ink-muted hover:text-ink">
          Cancel
        </Link>
        {dirty ? <span className="text-sm text-warning">Unsaved changes</span> : null}
      </div>
    </form>
  );
}
