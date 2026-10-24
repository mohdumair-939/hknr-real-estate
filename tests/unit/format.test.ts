import { describe, expect, it } from "vitest";
import {
  bhk,
  formatArea,
  formatInr,
  formatInrCompact,
  formatPhoneDisplay,
  formatPrice,
  normalizeIndianPhone,
  slugify,
  whatsappHref,
} from "@/lib/format";

describe("Indian currency formatting", () => {
  it("uses lakh/crore grouping", () => {
    expect(formatInr(4500000)).toBe("₹45,00,000");
    expect(formatInr(12500000)).toBe("₹1,25,00,000");
  });
  it("compacts to L and Cr without trailing zeros", () => {
    expect(formatInrCompact(4500000)).toBe("₹45 L");
    expect(formatInrCompact(12000000)).toBe("₹1.2 Cr");
    expect(formatInrCompact(8850000)).toBe("₹88.5 L");
    expect(formatInrCompact(85000)).toBe("₹85,000");
  });
  it("never invents a price", () => {
    expect(formatPrice({ priceInr: null, priceOnRequest: false })).toBe("Price on request");
    expect(formatPrice({ priceInr: 5000000, priceOnRequest: true })).toBe("Price on request");
  });
});

describe("areas", () => {
  it("labels units explicitly", () => {
    expect(formatArea("167.00", "sq_yd")).toBe("167 sq yd");
    expect(formatArea(1150, "sq_ft")).toBe("1,150 sq ft");
    expect(formatArea(null, "sq_ft")).toBeNull();
  });
  it("formats BHK", () => {
    expect(bhk(3)).toBe("3 BHK");
    expect(bhk(0)).toBe("Studio");
    expect(bhk(null)).toBeNull();
  });
});

describe("phone numbers", () => {
  it.each([
    ["98480 12345", "919848012345"],
    ["+91 98480-12345", "919848012345"],
    ["09848012345", "919848012345"],
    ["4027123456", "914027123456"],
  ])("normalises %s", (input, out) => expect(normalizeIndianPhone(input)).toBe(out));

  it.each(["12345", "0123456789", "98480123456789", "abcdefghij"])("rejects %s", (input) =>
    expect(normalizeIndianPhone(input)).toBeNull(),
  );

  it("displays and links correctly", () => {
    expect(formatPhoneDisplay("919848012345")).toBe("+91 98480 12345");
    expect(whatsappHref("919848012345", "Hi & hello?")).toBe("https://wa.me/919848012345?text=Hi%20%26%20hello%3F");
  });
});

describe("slugify", () => {
  it("produces URL-safe slugs", () => {
    expect(slugify("3 BHK House — East Facing!")).toBe("3-bhk-house-east-facing");
    expect(slugify("  Café  Road ")).toBe("cafe-road");
  });
});
