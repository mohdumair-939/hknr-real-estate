"use client";

import { useSyncExternalStore } from "react";

/*
 * Saved and recently viewed property ids, kept only in this browser's localStorage.
 * Nothing is sent to the server except ids when rendering the /saved page.
 */

const KEYS = { saved: "hknr:saved", recent: "hknr:recent" } as const;
type ListName = keyof typeof KEYS;
const LIMITS: Record<ListName, number> = { saved: 24, recent: 12 };
const EVENT = "hknr-store";

function read(list: ListName): string[] {
  try {
    const raw = window.localStorage.getItem(KEYS[list]);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, LIMITS[list]) : [];
  } catch {
    return [];
  }
}

function write(list: ListName, ids: string[]) {
  try {
    window.localStorage.setItem(KEYS[list], JSON.stringify(ids.slice(0, LIMITS[list])));
  } catch {
    // Storage unavailable (private mode, quota). The feature degrades silently.
  }
  window.dispatchEvent(new Event(EVENT));
}

const snapshots = new Map<ListName, { raw: string; value: string[] }>();
const EMPTY: string[] = [];

function snapshot(list: ListName): string[] {
  const value = read(list);
  const raw = value.join(",");
  const prev = snapshots.get(list);
  if (prev && prev.raw === raw) return prev.value;
  snapshots.set(list, { raw, value });
  return value;
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith("hknr:")) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useIdList(list: ListName): string[] {
  return useSyncExternalStore(subscribe, () => snapshot(list), () => EMPTY);
}

export function toggleSaved(id: string): boolean {
  const ids = read("saved");
  const has = ids.includes(id);
  write("saved", has ? ids.filter((x) => x !== id) : [id, ...ids]);
  return !has;
}

export function recordView(id: string) {
  write("recent", [id, ...read("recent").filter((x) => x !== id)]);
}

export function clearList(list: ListName) {
  write(list, []);
}
