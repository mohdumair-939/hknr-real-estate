import { describe, expect, it } from "vitest";
import { filtersToQuery, hasActiveFilters, parseFilters } from "@/lib/filters";

describe("catalogue filters", () => {
  it("parses valid parameters", () => {
    const f = parseFilters({ type: "plot", locality: "moula-ali", min: "2000000", max: "9000000", beds: "2", sort: "price_asc", page: "2" });
    expect(f).toMatchObject({ type: "plot", locality: "moula-ali", min: 2000000, max: 9000000, beds: 2, sort: "price_asc", page: 2 });
  });

  it("drops invalid values instead of failing", () => {
    const f = parseFilters({ type: "castle", locality: "../etc", min: "-5", beds: "99", sort: "random", page: "abc" });
    expect(f).toEqual({ q: undefined, type: undefined, txn: undefined, locality: undefined, min: undefined, max: undefined, beds: undefined, sort: "newest", page: 1 });
    expect(hasActiveFilters(f)).toBe(false);
  });

  it("swaps an inverted budget range", () => {
    const f = parseFilters({ min: "9000000", max: "2000000" });
    expect([f.min, f.max]).toEqual([2000000, 9000000]);
  });

  it("round-trips to a short canonical query", () => {
    const f = parseFilters({ type: "apartment", sort: "newest", page: "1" });
    expect(filtersToQuery(f)).toBe("?type=apartment");
    expect(filtersToQuery({ sort: "newest", page: 1 })).toBe("");
  });

  it("takes the first value of repeated params", () => {
    expect(parseFilters({ type: ["plot", "apartment"] }).type).toBe("plot");
  });
});
