import "server-only";
import sharp, { type Metadata as SharpMetadata } from "sharp";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "heif"]); // sharp reports AVIF as "heif"
export const VARIANT_WIDTHS = [480, 960, 1600, 2400] as const;
const MAX_WIDTH = VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1];
const MIN_DIMENSION = 400;

export class ImageError extends Error {}

export type ProcessedImage = {
  width: number;
  height: number;
  variants: { width: number; body: Buffer }[];
  blurDataUrl: string;
  byteSize: number;
};

/** Widths to generate for an image of the given width: standard steps below it, plus the capped original. */
export function variantWidthsFor(width: number): number[] {
  const steps: number[] = VARIANT_WIDTHS.filter((w) => w < width);
  steps.push(Math.min(width, MAX_WIDTH));
  return [...new Set(steps)].sort((a, b) => a - b);
}

/**
 * Validates an upload by decoding it (the extension and MIME header are never trusted),
 * auto-rotates from EXIF, strips all metadata including GPS, and produces WebP variants.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new ImageError("The photo is larger than 15 MB. Export a smaller copy and try again.");
  }

  let meta: SharpMetadata;
  try {
    meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new ImageError("This file isn't a readable image. Upload a JPEG, PNG, WebP or AVIF photo.");
  }
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw new ImageError("Unsupported image format. Upload a JPEG, PNG, WebP or AVIF photo.");
  }

  // Orientations 5–8 swap width and height.
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;
  if (!width || !height) throw new ImageError("Couldn't read the image dimensions.");
  if (Math.min(width, height) < MIN_DIMENSION) {
    throw new ImageError(
      `The photo is too small (${width}×${height}px). Use an image at least ${MIN_DIMENSION}px on its shortest side.`,
    );
  }

  const base = sharp(input, { limitInputPixels: 60_000_000 }).rotate();
  const variants = await Promise.all(
    variantWidthsFor(width).map(async (w) => ({
      width: w,
      body: await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toBuffer(),
    })),
  );
  const blur = await base.clone().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();

  return {
    width,
    height,
    variants,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
    byteSize: variants.reduce((n, v) => n + v.body.byteLength, 0),
  };
}
