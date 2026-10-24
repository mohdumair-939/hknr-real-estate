"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { PROPERTY_TYPE_LABEL, TRANSACTION_LABEL, type PropertyType, type TransactionType } from "@/lib/domain";
import { BUDGET_STEPS, filtersToQuery, SORT_LABEL, SORTS, type PropertyFilters, type Sort } from "@/lib/filters";
import { formatInrCompact } from "@/lib/format";
import type { Facets } from "@/lib/queries/public";

/* --------------------------------------------------------------- context */

type Ctx = { pending: boolean; apply: (f: Partial<PropertyFilters>) => void };
const CatalogueCtx = createContext<Ctx | null>(null);

function useCatalogue() {
  const ctx = use(CatalogueCtx);
  if (!ctx) throw new Error("Catalogue controls must be inside <CatalogueShell>");
  return ctx;
}

/** Owns navigation for filter changes so results can show a pending state while the server re-renders. */
export function CatalogueShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const apply = (f: Partial<PropertyFilters>) =>
    startTransition(() => router.push(`/properties${filtersToQuery({ ...f, page: 1 })}`, { scroll: false }));
  return <CatalogueCtx value={{ pending, apply }}>{children}</CatalogueCtx>;
}

export function ResultsRegion({ children }: { children: ReactNode }) {
  const { pending } = useCatalogue();
  return (
    <div aria-busy={pending} className={cn("transition-opacity", pending && "pointer-events-none opacity-50")}>
      <p aria-live="polite" className="sr-only">
        {pending ? "Updating results" : ""}
      </p>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------- fields */

type FormState = {
  q: string;
  type: string;
  txn: string;
  locality: string;
  min: string;
  max: string;
  beds: string;
};

const toForm = (f: PropertyFilters): FormState => ({
  q: f.q ?? "",
  type: f.type ?? "",
  txn: f.txn ?? "",
  locality: f.locality ?? "",
  min: f.min ? String(f.min) : "",
  max: f.max ? String(f.max) : "",
  beds: f.beds ? String(f.beds) : "",
});

const fromForm = (s: FormState, sort: Sort): Partial<PropertyFilters> => ({
  q: s.q.trim() || undefined,
  type: (s.type || undefined) as PropertyType | undefined,
  txn: (s.txn || undefined) as TransactionType | undefined,
  locality: s.locality || undefined,
  min: s.min ? Number(s.min) : undefined,
  max: s.max ? Number(s.max) : undefined,
  beds: s.beds ? Number(s.beds) : undefined,
  sort,
});

function FilterFields({
  idPrefix,
  facets,
  state,
  onChange,
}: {
  idPrefix: string;
  facets: Facets;
  state: FormState;
  onChange: (patch: Partial<FormState>) => void;
}) {
  const id = (n: string) => `${idPrefix}-${n}`;
  const showBeds = facets.hasBedrooms && (state.type === "" || state.type !== "plot");
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("type")} className="text-sm font-semibold">
          Property type
        </label>
        <Select id={id("type")} value={state.type} onChange={(e) => onChange({ type: e.target.value })}>
          <option value="">Any type</option>
          {facets.types.map((t) => (
            <option key={t.value} value={t.value}>
              {PROPERTY_TYPE_LABEL[t.value]} ({t.count})
            </option>
          ))}
        </Select>
      </div>

      {facets.transactions.length > 1 ? (
        <fieldset>
          <legend className="text-sm font-semibold">Looking to</legend>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-md border border-line-strong p-1">
            {[{ v: "", l: "Any" }, ...facets.transactions.map((t) => ({ v: t, l: t === "sale" ? "Buy" : "Rent" }))].map((o) => (
              <label
                key={o.v}
                title={o.v ? TRANSACTION_LABEL[o.v as TransactionType] : undefined}
                className="flex min-h-10 cursor-pointer items-center justify-center rounded-sm text-sm font-medium has-[:checked]:bg-charcoal has-[:checked]:text-ivory has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
              >
                <input
                  type="radio"
                  name={id("txn")}
                  value={o.v}
                  checked={state.txn === o.v}
                  onChange={() => onChange({ txn: o.v })}
                  className="sr-only"
                />
                {o.l}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("locality")} className="text-sm font-semibold">
          Locality
        </label>
        <Select id={id("locality")} value={state.locality} onChange={(e) => onChange({ locality: e.target.value })}>
          <option value="">Any locality</option>
          {facets.localities.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name} ({l.count})
            </option>
          ))}
        </Select>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Budget</legend>
        <p className="mt-0.5 text-sm text-ink-muted">Listings marked “price on request” are hidden when a budget is set.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={id("min")} className="sr-only">
              Minimum budget
            </label>
            <Select id={id("min")} value={state.min} onChange={(e) => onChange({ min: e.target.value })}>
              <option value="">No min</option>
              {BUDGET_STEPS.map((b) => (
                <option key={b} value={b}>
                  {formatInrCompact(b)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor={id("max")} className="sr-only">
              Maximum budget
            </label>
            <Select id={id("max")} value={state.max} onChange={(e) => onChange({ max: e.target.value })}>
              <option value="">No max</option>
              {BUDGET_STEPS.map((b) => (
                <option key={b} value={b}>
                  {formatInrCompact(b)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </fieldset>

      {showBeds ? (
        <fieldset>
          <legend className="text-sm font-semibold">Bedrooms</legend>
          <div className="mt-2 grid grid-cols-5 gap-1">
            {["", "1", "2", "3", "4"].map((b) => (
              <label
                key={b}
                className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-line-strong text-sm font-medium has-[:checked]:border-charcoal has-[:checked]:bg-charcoal has-[:checked]:text-ivory has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
              >
                <input
                  type="radio"
                  name={id("beds")}
                  value={b}
                  checked={state.beds === b}
                  onChange={() => onChange({ beds: b })}
                  className="sr-only"
                />
                {b === "" ? "Any" : `${b}+`}
                {b !== "" ? <span className="sr-only"> bedrooms or more</span> : null}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- panels */

/** Keyword search + desktop sidebar (applies immediately) + mobile drawer (applies on "Show results"). */
export function CatalogueFilters({ facets, filters, activeCount }: { facets: Facets; filters: PropertyFilters; activeCount: number }) {
  const { apply, pending } = useCatalogue();
  const [desktop, setDesktop] = useState<FormState>(() => toForm(filters));
  const [mobile, setMobile] = useState<FormState>(() => toForm(filters));
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Keep local state in sync when the URL changes (chips, back button, pagination).
  const filtersKey = filtersToQuery(filters);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDesktop(toForm(filters));
    setMobile(toForm(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const changeDesktop = (patch: Partial<FormState>) => {
    const next = { ...desktop, ...patch };
    setDesktop(next);
    if (!("q" in patch)) apply(fromForm(next, filters.sort));
  };

  return (
    <>
      <form
        role="search"
        aria-label="Search properties"
        onSubmit={(e) => {
          e.preventDefault();
          apply(fromForm({ ...desktop, q: desktop.q }, filters.sort));
        }}
        className="flex gap-2"
      >
        <label htmlFor="cat-q" className="sr-only">
          Search by keyword, locality or reference
        </label>
        <Input
          id="cat-q"
          type="search"
          enterKeyHint="search"
          placeholder="Keyword, locality or reference (e.g. HK-P-0012)"
          value={desktop.q}
          onChange={(e) => {
            setDesktop((s) => ({ ...s, q: e.target.value }));
            setMobile((s) => ({ ...s, q: e.target.value }));
          }}
          maxLength={80}
        />
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>

      <div className="mt-4 lg:hidden">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            setMobile(toForm(filters));
            dialogRef.current?.showModal();
          }}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal aria-hidden="true" /> Filters
          {activeCount ? (
            <span className="ml-1 rounded-full bg-charcoal px-2 py-0.5 text-xs text-ivory">{activeCount}</span>
          ) : null}
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="filters-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-0 mt-auto h-[90dvh] max-h-none w-full max-w-none rounded-t-lg bg-surface p-0 text-ink"
      >
        <form
          className="flex h-full flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            dialogRef.current?.close();
            apply(fromForm(mobile, filters.sort));
          }}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <h2 id="filters-title" className="text-h3">
              Filters
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-md hover:bg-sunken"
              aria-label="Close filters"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <FilterFields idPrefix="m" facets={facets} state={mobile} onChange={(p) => setMobile((s) => ({ ...s, ...p }))} />
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMobile({ q: mobile.q, type: "", txn: "", locality: "", min: "", max: "", beds: "" })}
            >
              Reset
            </Button>
            <Button type="submit">Show results</Button>
          </div>
        </form>
      </dialog>

      <aside aria-label="Filters" className="hidden lg:block">
        <div className="mt-6 rounded-md border border-line bg-surface p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wide uppercase">Filters</h2>
            {pending ? <span className="text-xs text-ink-muted">Updating…</span> : null}
          </div>
          <FilterFields idPrefix="d" facets={facets} state={desktop} onChange={changeDesktop} />
        </div>
      </aside>
    </>
  );
}

export function SortSelect({ filters }: { filters: PropertyFilters }) {
  const { apply } = useCatalogue();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="cat-sort" className="text-sm whitespace-nowrap text-ink-muted">
        Sort by
      </label>
      <Select
        id="cat-sort"
        value={filters.sort}
        onChange={(e) => apply({ ...filters, sort: e.target.value as Sort })}
        className="min-h-10 py-1.5 text-sm"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABEL[s]}
          </option>
        ))}
      </Select>
    </div>
  );
}
