import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { ImageError, processImage, variantWidthsFor } from "@/lib/images";
import { rateLimit } from "@/lib/rate-limit";
import { assertSafeKey } from "@/lib/storage/keys";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { resetDb } from "../support/db";

beforeEach(resetDb);

describe("image processing", () => {
  it("rejects files that are not images regardless of extension", async () => {
    await expect(processImage(Buffer.from("<?php echo 1; ?>"))).rejects.toBeInstanceOf(ImageError);
  });

  it("rejects tiny images", async () => {
    const small = await sharp({ create: { width: 200, height: 150, channels: 3, background: "#888" } }).jpeg().toBuffer();
    await expect(processImage(small)).rejects.toThrow(/too small/);
  });

  it("produces WebP variants without upscaling and strips metadata", async () => {
    const input = await sharp({ create: { width: 1200, height: 900, channels: 3, background: "#888" } })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: "secret-gps-test" } } })
      .toBuffer();
    const r = await processImage(input);
    expect(r.variants.map((v) => v.width)).toEqual([480, 960, 1200]);
    const meta = await sharp(r.variants[0].body).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
    expect(r.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
  });

  it("chooses variant widths sensibly", () => {
    expect(variantWidthsFor(400)).toEqual([400]);
    expect(variantWidthsFor(5000)).toEqual([480, 960, 1600, 2400]);
  });
});

describe("storage keys", () => {
  it("rejects traversal and odd characters", () => {
    expect(() => assertSafeKey("properties/a/b")).not.toThrow();
    for (const bad of ["../etc/passwd", "properties/../../x", "/abs", "a//b", "a\\b", "A/B"]) expect(() => assertSafeKey(bad)).toThrow();
  });
});

describe("rate limiter", () => {
  it("allows up to the limit within a window", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit("test:key", 3, 60));
    expect(results).toEqual([true, true, true, false]);
  });
});

describe("password hashing", () => {
  it("verifies correct passwords only and salts each hash", async () => {
    const a = await hashPassword("correct horse battery");
    const b = await hashPassword("correct horse battery");
    expect(a).not.toBe(b);
    expect(await verifyPassword("correct horse battery", a)).toBe(true);
    expect(await verifyPassword("wrong", a)).toBe(false);
    expect(await verifyPassword("anything", "garbage")).toBe(false);
  });
});
