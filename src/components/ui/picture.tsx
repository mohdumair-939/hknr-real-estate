import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/storage/public-url";

export type ImageData = {
  storageKey: string;
  width: number;
  height: number;
  variants: number[];
  blurDataUrl: string | null;
  altText: string;
};

/**
 * Responsive image from pre-generated WebP variants. Uses a plain <img> because variants
 * are produced at upload time (see lib/images.ts), so no runtime optimiser is needed.
 */
export function Picture({
  image,
  sizes,
  priority = false,
  className,
  alt,
}: {
  image: ImageData;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Overrides stored alt text, e.g. "" when an adjacent heading already describes the image. */
  alt?: string;
}) {
  const srcSet = image.variants.map((w) => `${mediaUrl(image.storageKey, w)} ${w}w`).join(", ");
  const fallback = mediaUrl(image.storageKey, image.variants.find((w) => w >= 960) ?? image.variants[image.variants.length - 1]);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- variants are pre-generated; see comment above
    <img
      src={fallback}
      srcSet={srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt ?? image.altText}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      className={cn("object-cover", className)}
      style={
        image.blurDataUrl
          ? { backgroundImage: `url(${image.blurDataUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    />
  );
}

/** Neutral placeholder for listings without photos. Says so plainly instead of faking an image. */
export function NoPhoto({ label = "Photos coming soon", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-2 bg-sunken text-sm font-medium text-ink-muted",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21V9l9-6 9 6v12" />
        <path d="M9 21v-7h6v7" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
