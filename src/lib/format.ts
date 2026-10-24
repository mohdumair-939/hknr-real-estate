import { AREA_UNIT_LABEL, type AreaUnit } from "./domain";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const indian = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/** ₹45,00,000 — full Indian grouping. */
export function formatInr(amount: number): string {
  return inr.format(amount);
}

/**
 * Compact Indian form used on cards: ₹45 L, ₹1.25 Cr, ₹85,000.
 * Trailing zeros are dropped so "₹1.20 Cr" reads "₹1.2 Cr".
 */
export function formatInrCompact(amount: number): string {
  const trim = (n: number) => String(Number(n.toFixed(2)));
  if (amount >= 1_00_00_000) return `₹${trim(amount / 1_00_00_000)} Cr`;
  if (amount >= 1_00_000) return `₹${trim(amount / 1_00_000)} L`;
  return formatInr(amount);
}

export function formatPrice(p: { priceInr: number | null; priceOnRequest: boolean }, compact = false): string {
  if (p.priceOnRequest || p.priceInr == null) return "Price on request";
  return compact ? formatInrCompact(p.priceInr) : formatInr(p.priceInr);
}

export function formatNumber(n: number | string): string {
  return indian.format(typeof n === "string" ? Number(n) : n);
}

export function formatArea(value: number | string | null | undefined, unit: AreaUnit): string | null {
  if (value == null || value === "") return null;
  return `${formatNumber(value)} ${AREA_UNIT_LABEL[unit]}`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export const formatDate = (d: Date | string) => dateFmt.format(new Date(d));
export const formatDateTime = (d: Date | string) => dateTimeFmt.format(new Date(d));

/** "3 BHK" style label; null when not applicable. */
export function bhk(bedrooms: number | null | undefined): string | null {
  if (bedrooms == null) return null;
  return bedrooms === 0 ? "Studio" : `${bedrooms} BHK`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Indian mobile numbers to E.164 digits (no plus): "098480 12345" → "919848012345". */
export function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let local = digits;
  if (digits.length === 12 && digits.startsWith("91")) local = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) local = digits.slice(1);
  if (local.length !== 10) return null;
  // Mobile numbers start 6–9; landlines with STD code are also 10 digits (e.g. 40xxxxxxxx for Hyderabad).
  if (!/^[2-9]\d{9}$/.test(local)) return null;
  return `91${local}`;
}

/** "+91 98480 12345" for display. Input is the normalised 91XXXXXXXXXX form. */
export function formatPhoneDisplay(e164Digits: string): string {
  const local = e164Digits.startsWith("91") ? e164Digits.slice(2) : e164Digits;
  if (local.length !== 10) return `+${e164Digits}`;
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

export function telHref(e164Digits: string): string {
  return `tel:+${e164Digits}`;
}

export function whatsappHref(e164Digits: string, message?: string): string {
  const base = `https://wa.me/${e164Digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
