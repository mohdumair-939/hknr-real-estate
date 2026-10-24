"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitEnquiry, type EnquiryState } from "@/app/actions/enquiry";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { CONTACT_METHODS, CONTACT_METHOD_LABEL, ENQUIRY_CATEGORIES, ENQUIRY_CATEGORY_LABEL, type EnquiryCategory } from "@/lib/domain";
import { enquirySchema, fieldErrors, formToObject, type FieldErrors } from "@/lib/validation";

type Props = {
  /** Fixed category (hidden) — e.g. "construction" on the construction page. */
  category?: EnquiryCategory;
  /** Category shown pre-selected when the visitor can still change it. */
  defaultCategory?: EnquiryCategory;
  propertyId?: string;
  projectId?: string;
  /** Shown above the form so the visitor knows what the enquiry is about. */
  subject?: string;
  messagePlaceholder?: string;
  submitLabel?: string;
  idPrefix?: string;
};

const UTM_KEY = "hknr:utm";

function readUtm(): Record<string, string> {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign"]) {
      const v = params.get(k);
      if (v) fromUrl[k] = v.slice(0, 100);
    }
    if (Object.keys(fromUrl).length) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }
    return JSON.parse(sessionStorage.getItem(UTM_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function EnquiryForm({
  category,
  defaultCategory = "buy",
  propertyId,
  projectId,
  subject,
  messagePlaceholder = "Tell us what you're looking for — budget, locality, timing…",
  submitLabel = "Send enquiry",
  idPrefix = "enq",
}: Props) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, { status: "idle" });
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [startedAt, setStartedAt] = useState("");
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [pathname, setPathname] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [resetCount, setResetCount] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    // Client-only values: set after hydration so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStartedAt(String(Date.now()));
    setPathname(window.location.pathname);
    setUtm(readUtm());
  }, [resetCount]);

  const serverErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };
  const values = state.status === "error" ? state.values : {};

  // Move focus to the outcome so keyboard and screen-reader users hear it.
  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
    if (state.status === "error") {
      const firstInvalid = formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]");
      (firstInvalid ?? formRef.current?.querySelector<HTMLElement>("[role=alert]"))?.focus();
    }
  }, [state]);

  if (state.status === "success" && dismissed !== state.reference) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-md border border-success/30 bg-success-soft p-6 outline-none"
      >
        <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
        <h3 className="mt-3 text-h3">Thank you — your enquiry has been received.</h3>
        <p className="mt-2 text-ink">
          Your reference is <strong className="font-semibold">{state.reference}</strong>. Someone from HKNR will contact you
          using the details you gave. Please quote this reference if you call us.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/properties" className="font-semibold underline underline-offset-4">
            Browse properties
          </Link>
          <button
            type="button"
            className="font-semibold underline underline-offset-4"
            onClick={() => {
              setDismissed(state.reference);
              setResetCount((n) => n + 1);
            }}
          >
            Send another enquiry
          </button>
        </div>
      </div>
    );
  }

  const id = (name: string) => `${idPrefix}-${name}`;
  const formKey = state.status === "error" ? JSON.stringify(values) : `fresh-${resetCount}`;

  return (
    <form
      key={formKey}
      ref={formRef}
      action={action}
      noValidate
      onSubmit={(e) => {
        const parsed = enquirySchema.safeParse(formToObject(new FormData(e.currentTarget)));
        if (!parsed.success) {
          e.preventDefault();
          const errs = fieldErrors(parsed.error);
          setClientErrors(errs);
          requestAnimationFrame(() =>
            formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(),
          );
        } else {
          setClientErrors({});
        }
      }}
      onChange={(e) => {
        const name = (e.target as unknown as HTMLInputElement).name;
        if (name && clientErrors[name])
          setClientErrors((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
      }}
      className="flex flex-col gap-5"
    >
      {subject ? (
        <p className="rounded-md bg-sunken px-4 py-3 text-sm">
          <span className="text-ink-muted">Enquiring about: </span>
          <span className="font-semibold">{subject}</span>
        </p>
      ) : null}

      {state.status === "error" ? (
        <div role="alert" tabIndex={-1} className="outline-none">
          <Alert tone="danger" title="Your enquiry wasn't sent yet">
            {state.message}
          </Alert>
        </div>
      ) : null}

      {category ? (
        <input type="hidden" name="category" value={category} />
      ) : (
        <Field id={id("category")} label="What is your enquiry about?" error={errors.category}>
          {(a) => (
            <Select {...a} name="category" defaultValue={values.category ?? defaultCategory}>
              {ENQUIRY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ENQUIRY_CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      <Field id={id("name")} label="Your name" error={errors.name}>
        {(a) => <Input {...a} name="name" autoComplete="name" maxLength={80} defaultValue={values.name} required />}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("phone")} label="Phone number" hint="10-digit Indian number" error={errors.phone}>
          {(a) => (
            <Input
              {...a}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              defaultValue={values.phone}
            />
          )}
        </Field>
        <Field id={id("email")} label="Email" optional hint="If you prefer email" error={errors.email}>
          {(a) => (
            <Input
              {...a}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={160}
              defaultValue={values.email}
            />
          )}
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">How should we contact you?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONTACT_METHODS.map((m) => (
            <label
              key={m}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 text-sm has-[:checked]:border-charcoal has-[:checked]:bg-charcoal has-[:checked]:text-ivory has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
            >
              <input
                type="radio"
                name="preferredContact"
                value={m}
                defaultChecked={(values.preferredContact ?? "phone") === m}
                className="sr-only"
              />
              {CONTACT_METHOD_LABEL[m]}
            </label>
          ))}
        </div>
      </fieldset>

      <Field id={id("message")} label="Message" optional error={errors.message}>
        {(a) => (
          <Textarea {...a} name="message" rows={4} maxLength={2000} placeholder={messagePlaceholder} defaultValue={values.message} />
        )}
      </Field>

      <Checkbox
        id={id("consent")}
        name="consent"
        defaultChecked={values.consent === "on"}
        error={errors.consent}
        label={
          <>
            HKNR may contact me about this enquiry using the details above. See our{" "}
            <Link href="/privacy" className="underline underline-offset-4" target="_blank">
              privacy notice
            </Link>
            .
          </>
        }
      />

      {/* Spam trap: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company website
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="sourcePath" value={pathname} />
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
      {utm.utm_source ? <input type="hidden" name="utmSource" value={utm.utm_source} /> : null}
      {utm.utm_medium ? <input type="hidden" name="utmMedium" value={utm.utm_medium} /> : null}
      {utm.utm_campaign ? <input type="hidden" name="utmCampaign" value={utm.utm_campaign} /> : null}

      <div>
        <Button type="submit" size="lg" pending={pending} className="w-full sm:w-auto">
          {pending ? "Sending…" : submitLabel}
        </Button>
        <p className="mt-3 text-sm text-ink-muted">We only use these details to reply to you.</p>
      </div>
    </form>
  );
}
