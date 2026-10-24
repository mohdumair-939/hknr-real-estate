import { describe, expect, it } from "vitest";
import { enquirySchema, fieldErrors, propertySchema, publishProblems, settingsSchema } from "@/lib/validation";

const validEnquiry = { category: "buy", name: "Asha", phone: "98480 12345", consent: "on", message: "" };

describe("enquiry validation", () => {
  it("accepts a minimal valid enquiry and normalises the phone", () => {
    const r = enquirySchema.safeParse(validEnquiry);
    expect(r.success).toBe(true);
    expect(r.data?.phone).toBe("919848012345");
  });

  it("requires a way to reply", () => {
    const r = enquirySchema.safeParse({ ...validEnquiry, phone: "" });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!).phone).toMatch(/phone number or an email/);
  });

  it("requires consent", () => {
    const r = enquirySchema.safeParse({ ...validEnquiry, consent: undefined });
    expect(fieldErrors(r.error!).consent).toBeTruthy();
  });

  it("requires email when email is the preferred method", () => {
    const r = enquirySchema.safeParse({ ...validEnquiry, preferredContact: "email" });
    expect(fieldErrors(r.error!).email).toMatch(/email/);
  });

  it("limits message length", () => {
    const r = enquirySchema.safeParse({ ...validEnquiry, message: "x".repeat(2001) });
    expect(fieldErrors(r.error!).message).toMatch(/2,000/);
  });

  it("rejects unknown categories and malformed ids", () => {
    expect(enquirySchema.safeParse({ ...validEnquiry, category: "loan" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...validEnquiry, propertyId: "1; drop table" }).success).toBe(false);
  });
});

const baseProperty = {
  title: "3 BHK independent house",
  type: "independent_house",
  localityId: "6f0c2c4e-3a0b-4c9e-8b65-1a2b3c4d5e6f",
  description: "",
};

describe("property validation", () => {
  it("parses rupee input with commas and symbols", () => {
    const r = propertySchema.safeParse({ ...baseProperty, priceInr: "₹45,00,000" });
    expect(r.data?.priceInr).toBe(4500000);
  });

  it("requires a unit when a plot area is given", () => {
    const r = propertySchema.safeParse({ ...baseProperty, plotArea: "200" });
    expect(fieldErrors(r.error!).plotAreaUnit).toBeTruthy();
  });

  it("flags carpet area larger than built-up area", () => {
    const r = propertySchema.safeParse({ ...baseProperty, builtUpAreaSqft: "1000", carpetAreaSqft: "1200" });
    expect(fieldErrors(r.error!).carpetAreaSqft).toMatch(/smaller/);
  });

  it("splits features by line", () => {
    const r = propertySchema.safeParse({ ...baseProperty, features: "Lift\n\n Borewell \n" });
    expect(r.data?.features).toEqual(["Lift", "Borewell"]);
  });
});

describe("publish rules", () => {
  it("lists everything missing", () => {
    expect(publishProblems({ priceInr: null, priceOnRequest: false, description: "short", photoCount: 0 })).toHaveLength(3);
  });
  it("accepts price on request", () => {
    expect(publishProblems({ priceInr: null, priceOnRequest: true, description: "x".repeat(40), photoCount: 1 })).toEqual([]);
  });
});

describe("settings validation", () => {
  it("rejects non-http links and requires address when shown", () => {
    const r = settingsSchema.safeParse({ mapUrl: "javascript:alert(1)", showAddress: "on" });
    const e = fieldErrors(r.error!);
    expect(e.mapUrl).toBeTruthy();
    expect(e.addressLine).toBeTruthy();
  });
});
