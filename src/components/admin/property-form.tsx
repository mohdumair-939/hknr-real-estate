"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { FormState } from "@/app/admin/actions/_shared";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import {
  AREA_UNIT_LABEL,
  AREA_UNITS,
  AVAILABILITIES,
  AVAILABILITY_LABEL,
  CONSTRUCTION_STATUS_LABEL,
  CONSTRUCTION_STATUSES,
  FACING_LABEL,
  FACINGS,
  hasPlotArea,
  hasRooms,
  PROPERTY_TYPE_LABEL,
  PROPERTY_TYPES,
  TRANSACTION_LABEL,
  TRANSACTION_TYPES,
  type PropertyType,
} from "@/lib/domain";
import { formatInr } from "@/lib/format";
import { FormResult, useAdminForm, useUnsavedGuard } from "./form-bits";

export type PropertyFormValues = {
  title?: string;
  type?: PropertyType;
  transaction?: string;
  localityId?: string;
  description?: string;
  priceInr?: number | null;
  priceOnRequest?: boolean;
  priceNegotiable?: boolean;
  locationNote?: string | null;
  addressPrivate?: string | null;
  plotArea?: string | null;
  plotAreaUnit?: string | null;
  builtUpAreaSqft?: string | null;
  carpetAreaSqft?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  facing?: string | null;
  floorNumber?: number | null;
  totalFloors?: number | null;
  constructionStatus?: string | null;
  approvals?: string | null;
  reraNumber?: string | null;
  features?: string[];
  availability?: string;
  isFeatured?: boolean;
};

type Dupe = { id: string; reference: string; title: string; status: string };

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
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

const str = (v: unknown) => (v == null ? "" : String(v));

export function PropertyForm({
  action,
  initial = {},
  localities,
  submitLabel,
  cancelHref,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  initial?: PropertyFormValues;
  localities: { id: string; name: string }[];
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, onSubmit, pending] = useAdminForm(action);
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = useUnsavedGuard(formRef, state.ok);
  const [type, setType] = useState<PropertyType>(initial.type ?? "independent_house");
  const [onRequest, setOnRequest] = useState(Boolean(initial.priceOnRequest));
  const [price, setPrice] = useState(str(initial.priceInr));
  const e = state.fieldErrors ?? {};
  const dupes = (state.data?.duplicates as Dupe[] | undefined) ?? [];
  const priceNum = Number(price.replace(/[,₹\s]/g, ""));

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormResult state={{ ...state, error: dupes.length ? undefined : state.error }} />

      {dupes.length ? (
        <div role="alert">
          <Alert tone="warning" title="Possible duplicate">
            <p>{state.error}</p>
            <ul className="mt-2 list-disc pl-5">
              {dupes.map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/properties/${d.id}`} target="_blank" className="font-semibold underline">
                    {d.reference}: {d.title}
                  </Link>{" "}
                  ({d.status})
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Checkbox id="confirmDuplicate" name="confirmDuplicate" label="I've checked — this is a different property. Save it anyway." />
            </div>
          </Alert>
        </div>
      ) : null}

      <Section title="Basics">
        <Field id="title" label="Listing title" hint="Describe the property, e.g. “3 BHK independent house on 200 sq yd, east facing”" error={e.title} className="md:col-span-2">
          {(a) => <Input {...a} name="title" defaultValue={initial.title} maxLength={140} required />}
        </Field>
        <Field id="type" label="Property type" error={e.type}>
          {(a) => (
            <Select {...a} name="type" value={type} onChange={(ev) => setType(ev.target.value as PropertyType)}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="transaction" label="Listing for" error={e.transaction}>
          {(a) => (
            <Select {...a} name="transaction" defaultValue={initial.transaction ?? "sale"}>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TRANSACTION_LABEL[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          id="localityId"
          label="Locality"
          hint={
            <>
              Missing one?{" "}
              <Link href="/admin/localities" className="underline" target="_blank">
                Add a locality
              </Link>{" "}
              then reload.
            </>
          }
          error={e.localityId}
          className="md:col-span-2"
        >
          {(a) => (
            <Select {...a} name="localityId" defaultValue={initial.localityId ?? ""}>
              <option value="" disabled>
                Choose a locality
              </option>
              {localities.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </Section>

      <Section title="Price">
        <Field
          id="priceInr"
          label="Asking price (₹)"
          hint={priceNum > 0 && !onRequest ? `Shown as ${formatInr(priceNum)}` : "Whole rupees, e.g. 7500000 for ₹75 lakh"}
          error={e.priceInr}
        >
          {(a) => (
            <Input
              {...a}
              name="priceInr"
              inputMode="numeric"
              value={price}
              onChange={(ev) => setPrice(ev.target.value)}
              disabled={onRequest}
            />
          )}
        </Field>
        <div className="flex flex-col justify-end gap-3">
          <Checkbox
            id="priceOnRequest"
            name="priceOnRequest"
            checked={onRequest}
            onChange={(ev) => setOnRequest(ev.target.checked)}
            label="Price on request"
            hint="The website shows “Price on request” instead of a figure"
          />
          <Checkbox id="priceNegotiable" name="priceNegotiable" defaultChecked={initial.priceNegotiable} label="Negotiable" />
        </div>
      </Section>

      <Section title="Size and layout" description="Fill in only what applies. Empty fields are not shown on the website.">
        {hasPlotArea(type) ? (
          <div className="grid grid-cols-[1fr_8rem] gap-3 md:col-span-2">
            <Field id="plotArea" label="Plot area" hint="Land area" error={e.plotArea}>
              {(a) => <Input {...a} name="plotArea" inputMode="decimal" defaultValue={str(initial.plotArea)} />}
            </Field>
            <Field id="plotAreaUnit" label="Unit" error={e.plotAreaUnit} hint={" "}>
              {(a) => (
                <Select {...a} name="plotAreaUnit" defaultValue={initial.plotAreaUnit ?? "sq_yd"}>
                  {AREA_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {AREA_UNIT_LABEL[u]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        ) : null}
        {type !== "plot" ? (
          <>
            <Field id="builtUpAreaSqft" label="Built-up area (sq ft)" hint="Floor area including walls" error={e.builtUpAreaSqft}>
              {(a) => <Input {...a} name="builtUpAreaSqft" inputMode="decimal" defaultValue={str(initial.builtUpAreaSqft)} />}
            </Field>
            <Field id="carpetAreaSqft" label="Carpet area (sq ft)" optional hint="Usable area inside the walls" error={e.carpetAreaSqft}>
              {(a) => <Input {...a} name="carpetAreaSqft" inputMode="decimal" defaultValue={str(initial.carpetAreaSqft)} />}
            </Field>
          </>
        ) : null}
        {hasRooms(type) ? (
          <>
            <Field id="bedrooms" label="Bedrooms" error={e.bedrooms}>
              {(a) => <Input {...a} name="bedrooms" type="number" min={0} max={20} inputMode="numeric" defaultValue={str(initial.bedrooms)} />}
            </Field>
            <Field id="bathrooms" label="Bathrooms" error={e.bathrooms}>
              {(a) => <Input {...a} name="bathrooms" type="number" min={0} max={20} inputMode="numeric" defaultValue={str(initial.bathrooms)} />}
            </Field>
          </>
        ) : null}
        <Field id="facing" label="Facing" optional error={e.facing}>
          {(a) => (
            <Select {...a} name="facing" defaultValue={initial.facing ?? ""}>
              <option value="">Not specified</option>
              {FACINGS.map((f) => (
                <option key={f} value={f}>
                  {FACING_LABEL[f]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {type !== "plot" ? (
          <Field id="constructionStatus" label="Construction status" optional error={e.constructionStatus}>
            {(a) => (
              <Select {...a} name="constructionStatus" defaultValue={initial.constructionStatus ?? ""}>
                <option value="">Not specified</option>
                {CONSTRUCTION_STATUSES.map((c) => (
                  <option key={c} value={c}>
                    {CONSTRUCTION_STATUS_LABEL[c]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : null}
        {type === "apartment" || type === "commercial" ? (
          <Field id="floorNumber" label="Floor" optional hint="0 for ground floor" error={e.floorNumber}>
            {(a) => <Input {...a} name="floorNumber" type="number" inputMode="numeric" defaultValue={str(initial.floorNumber)} />}
          </Field>
        ) : null}
        {type !== "plot" ? (
          <Field id="totalFloors" label={type === "apartment" ? "Floors in building" : "Number of floors"} optional error={e.totalFloors}>
            {(a) => <Input {...a} name="totalFloors" type="number" min={1} inputMode="numeric" defaultValue={str(initial.totalFloors)} />}
          </Field>
        ) : null}
      </Section>

      <Section title="Description and features">
        <Field id="description" label="Description" hint="At least 40 characters before publishing. Describe only what you can confirm." error={e.description} className="md:col-span-2">
          {(a) => <Textarea {...a} name="description" rows={7} maxLength={6000} defaultValue={initial.description} />}
        </Field>
        <Field id="features" label="Features" optional hint="One per line, e.g. “Covered car parking”" error={e.features} className="md:col-span-2">
          {(a) => <Textarea {...a} name="features" rows={4} defaultValue={(initial.features ?? []).join("\n")} />}
        </Field>
      </Section>

      <Section title="Location and approvals">
        <Field id="locationNote" label="Public location note" optional hint="Shown on the website, e.g. nearby roads or landmarks" error={e.locationNote} className="md:col-span-2">
          {(a) => <Textarea {...a} name="locationNote" rows={2} maxLength={300} defaultValue={str(initial.locationNote)} />}
        </Field>
        <Field id="addressPrivate" label="Exact address (private)" optional hint="Only visible to staff, never on the website" error={e.addressPrivate} className="md:col-span-2">
          {(a) => <Textarea {...a} name="addressPrivate" rows={2} maxLength={300} defaultValue={str(initial.addressPrivate)} />}
        </Field>
        <Field id="approvals" label="Approvals" optional hint="Only what is documented, e.g. “HMDA approved layout”" error={e.approvals}>
          {(a) => <Input {...a} name="approvals" maxLength={300} defaultValue={str(initial.approvals)} />}
        </Field>
        <Field id="reraNumber" label="TS-RERA registration no." optional error={e.reraNumber}>
          {(a) => <Input {...a} name="reraNumber" maxLength={60} defaultValue={str(initial.reraNumber)} />}
        </Field>
      </Section>

      <Section title="Availability">
        <Field id="availability" label="Availability" error={e.availability}>
          {(a) => (
            <Select {...a} name="availability" defaultValue={initial.availability ?? "available"}>
              {AVAILABILITIES.map((v) => (
                <option key={v} value={v}>
                  {AVAILABILITY_LABEL[v]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="flex items-end">
          <Checkbox id="isFeatured" name="isFeatured" defaultChecked={initial.isFeatured} label="Feature on the home page" />
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" pending={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link href={cancelHref} className="inline-flex min-h-11 items-center px-3 font-semibold text-ink-muted hover:text-ink">
          Cancel
        </Link>
        {dirty ? <span className="text-sm text-warning">Unsaved changes</span> : null}
      </div>
    </form>
  );
}
