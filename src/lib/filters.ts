import { PROPERTY_TYPES, TRANSACTION_TYPES, type PropertyType, type TransactionType } from "./domain";

export const SORTS = ["newest", "price_asc", "price_desc"] as const;
export type Sort = (typeof SORTS)[number];
export const SORT_LABEL: Record<Sort, string> = {
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

export const PAGE_SIZE = 12;

export type PropertyFilters = {
  q?: string;
  type?: PropertyType;
  txn?: TransactionType;
  locality?: string; // locality slug
  min?: number;
  max?: number;
  beds?: number; // minimum bedrooms
  sort: Sort;
  page: number;
};

type Raw = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

function positiveInt(v: string | undefined, max: number): number | undefined {
  if (!v || !/^\d{1,12}$/.test(v)) return undefined;
  const n = Number(v);
  return n > 0 && n <= max ? n : undefined;
}

/**
 * Parses catalogue query parameters leniently: anything invalid is dropped rather than
 * producing an error page, because these URLs are shared and bookmarked.
 */
export function parseFilters(raw: Raw): PropertyFilters {
  const type = first(raw.type);
  const txn = first(raw.txn);
  const sort = first(raw.sort);
  let min = positiveInt(first(raw.min), 1_000_00_00_000);
  let max = positiveInt(first(raw.max), 1_000_00_00_000);
  if (min && max && min > max) [min, max] = [max, min];
  const locality = first(raw.locality);
  return {
    q: first(raw.q)?.slice(0, 80),
    type: PROPERTY_TYPES.includes(type as PropertyType) ? (type as PropertyType) : undefined,
    txn: TRANSACTION_TYPES.includes(txn as TransactionType) ? (txn as TransactionType) : undefined,
    locality: locality && /^[a-z0-9-]{1,80}$/.test(locality) ? locality : undefined,
    min,
    max,
    beds: positiveInt(first(raw.beds), 10),
    sort: SORTS.includes(sort as Sort) ? (sort as Sort) : "newest",
    page: positiveInt(first(raw.page), 500) ?? 1,
  };
}

/** Serialises filters back to a query string, omitting defaults so URLs stay short and canonical. */
export function filtersToQuery(f: Partial<PropertyFilters>): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.type) p.set("type", f.type);
  if (f.txn) p.set("txn", f.txn);
  if (f.locality) p.set("locality", f.locality);
  if (f.min) p.set("min", String(f.min));
  if (f.max) p.set("max", String(f.max));
  if (f.beds) p.set("beds", String(f.beds));
  if (f.sort && f.sort !== "newest") p.set("sort", f.sort);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function hasActiveFilters(f: PropertyFilters): boolean {
  return Boolean(f.q || f.type || f.txn || f.locality || f.min || f.max || f.beds);
}

/** Budget presets offered in selects (rupees). */
export const BUDGET_STEPS = [
  10_00_000, 20_00_000, 30_00_000, 40_00_000, 50_00_000, 75_00_000, 1_00_00_000, 1_50_00_000, 2_00_00_000, 3_00_00_000,
  5_00_00_000,
];
