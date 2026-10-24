"use client";

import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type GalleryImage = { src: string; srcSet: string; width: number; height: number; alt: string; blur: string | null };

/**
 * Listing gallery: lead image + thumbnails, with a keyboard-operable lightbox
 * (native <dialog>: Escape closes, focus is trapped and returned).
 */
export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = images.length;
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  const open = (i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
  };

  const lead = images[0];
  const rest = images.slice(1, 5);

  return (
    <div>
      <div className={cn("grid gap-2", rest.length ? "md:grid-cols-[2fr_1fr]" : "")}>
        <button
          type="button"
          onClick={() => open(0)}
          className="group relative block aspect-[4/3] overflow-hidden rounded-md bg-sunken md:aspect-auto md:min-h-[26rem]"
          aria-label={`View photo 1 of ${count}: ${lead.alt || title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- pre-generated variants */}
          <img
            src={lead.src}
            srcSet={lead.srcSet}
            sizes="(min-width: 1024px) 800px, 100vw"
            width={lead.width}
            height={lead.height}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            style={lead.blur ? { backgroundImage: `url(${lead.blur})`, backgroundSize: "cover" } : undefined}
          />
          {count > 1 ? (
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-sm bg-charcoal/85 px-3 py-1.5 text-sm font-semibold text-ivory">
              <Images className="size-4" aria-hidden="true" /> {count} photos
            </span>
          ) : null}
        </button>
        {rest.length ? (
          <div className="hidden grid-cols-2 grid-rows-2 gap-2 md:grid">
            {rest.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => open(i + 1)}
                className="relative min-h-32 overflow-hidden rounded-md bg-sunken"
                aria-label={`View photo ${i + 2} of ${count}${img.alt ? `: ${img.alt}` : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- pre-generated variants */}
                <img
                  src={img.src}
                  srcSet={img.srcSet}
                  sizes="200px"
                  width={img.width}
                  height={img.height}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <dialog
        ref={dialogRef}
        aria-label={`Photos of ${title}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-ivory"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-sm" aria-live="polite">
              Photo {index + 1} of {count}
            </p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-md hover:bg-white/10"
              aria-label="Close photos"
              autoFocus
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-16">
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-generated variants */}
            <img
              key={images[index].src}
              src={images[index].src}
              srcSet={images[index].srcSet}
              sizes="100vw"
              alt={images[index].alt}
              className="max-h-full max-w-full object-contain"
            />
            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute top-1/2 left-2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 hover:bg-black/80"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="size-7" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute top-1/2 right-2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 hover:bg-black/80"
                  aria-label="Next photo"
                >
                  <ChevronRight className="size-7" aria-hidden="true" />
                </button>
              </>
            ) : null}
          </div>
          {images[index].alt ? <p className="px-4 py-3 text-center text-sm text-ink-inverse-muted">{images[index].alt}</p> : null}
        </div>
      </dialog>
    </div>
  );
}
