import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { properties } from "@/lib/db/schema";
import { parseFilters } from "@/lib/filters";
import { getPropertyBySlug, getPropertyFacets, searchProperties } from "@/lib/queries/public";
import { db, makeLocality, resetDb } from "../support/db";

beforeEach(resetDb);
afterEach(() => {
  process.env.APP_ENV = "test";
});

async function seed() {
  const moula = await makeLocality("Moula Ali");
  const ecil = await makeLocality("ECIL");
  const base = { description: "x", publishedAt: new Date() };
  await db.insert(properties).values([
    { ...base, slug: "plot-1", title: "Plot one", type: "plot", localityId: moula.id, priceInr: 5_000_000, status: "published" },
    { ...base, slug: "house-1", title: "House one", type: "independent_house", localityId: ecil.id, priceInr: 12_000_000, bedrooms: 3, status: "published" },
    { ...base, slug: "flat-1", title: "Flat one", type: "apartment", localityId: moula.id, priceInr: 7_000_000, bedrooms: 2, status: "published", availability: "sold" },
    { ...base, slug: "draft-1", title: "Draft one", type: "plot", localityId: moula.id, priceInr: 1, status: "draft" },
    { ...base, slug: "sample-1", title: "Sample one", type: "plot", localityId: moula.id, priceInr: 1, status: "published", isSample: true },
  ]);
}

describe("public property queries", () => {
  it("never return drafts", async () => {
    await seed();
    const r = await searchProperties(parseFilters({}));
    expect(r.items.map((i) => i.slug)).not.toContain("draft-1");
    expect(await getPropertyBySlug("draft-1")).toBeNull();
  });

  it("hide sample data in production", async () => {
    await seed();
    expect((await searchProperties(parseFilters({}))).items.map((i) => i.slug)).toContain("sample-1");
    process.env.APP_ENV = "production";
    // env() caches; production visibility is read through showSampleContent → env(). Re-import fresh.
    const { vi } = await import("vitest");
    vi.resetModules();
    const fresh = await import("@/lib/queries/public");
    process.env.STORAGE_DRIVER = "s3";
    Object.assign(process.env, {
      S3_ENDPOINT: "https://example.invalid",
      S3_BUCKET: "b",
      S3_ACCESS_KEY_ID: "k",
      S3_SECRET_ACCESS_KEY: "s",
      S3_PUBLIC_BASE_URL: "https://img.example.invalid",
    });
    const items = (await fresh.searchProperties(parseFilters({}))).items.map((i) => i.slug);
    expect(items).not.toContain("sample-1");
    expect(await fresh.getPropertyBySlug("sample-1")).toBeNull();
    process.env.STORAGE_DRIVER = "local";
    vi.resetModules();
  });

  it("filter by type, locality, budget and bedrooms against real data", async () => {
    await seed();
    expect((await searchProperties(parseFilters({ type: "plot" }))).items.map((i) => i.slug)).toEqual(expect.arrayContaining(["plot-1"]));
    expect((await searchProperties(parseFilters({ locality: "ecil" }))).items.map((i) => i.slug)).toEqual(["house-1"]);
    expect((await searchProperties(parseFilters({ max: "8000000", type: "apartment" }))).items.map((i) => i.slug)).toEqual(["flat-1"]);
    expect((await searchProperties(parseFilters({ beds: "3" }))).items.map((i) => i.slug)).toEqual(["house-1"]);
  });

  it("sorts sold listings after available ones", async () => {
    await seed();
    const r = await searchProperties(parseFilters({ sort: "price_asc" }));
    expect(r.items.at(-1)?.slug).toBe("flat-1");
  });

  it("treats search text literally (no SQL wildcards)", async () => {
    await seed();
    expect((await searchProperties(parseFilters({ q: "%" }))).total).toBe(0);
    expect((await searchProperties(parseFilters({ q: "house" }))).items.map((i) => i.slug)).toEqual(["house-1"]);
  });

  it("derive facets only from published listings", async () => {
    await seed();
    const f = await getPropertyFacets();
    expect(f.localities.map((l) => l.slug).sort()).toEqual(["ecil", "moula-ali"]);
    expect(f.types.find((t) => t.value === "plot")?.count).toBe(2); // plot-1 + sample-1 (non-production)
  });
});
