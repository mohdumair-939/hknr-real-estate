"use client";

import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { NAV } from "@/lib/site";
import { useIsActive } from "./nav-links";

/**
 * Full-height drawer built on the native <dialog> element, which provides focus
 * trapping, Escape to close and an inert background without extra JavaScript.
 */
export function MobileNav({ phoneHref, phoneLabel }: { phoneHref: string | null; phoneLabel: string | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const isActive = useIsActive();

  // Close after navigation.
  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex size-11 items-center justify-center rounded-md text-ink hover:bg-sunken"
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
      <dialog
        ref={ref}
        aria-label="Menu"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-0 ml-auto h-dvh max-h-none w-[min(22rem,88vw)] max-w-none bg-surface p-0 text-ink shadow-(--shadow-overlay) backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col pt-[env(safe-area-inset-top)] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <span className="text-eyebrow text-ink-muted">Menu</span>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-md hover:bg-sunken"
              aria-label="Close menu"
              autoFocus
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-4">
            <ul className="flex flex-col">
              <li>
                <Link
                  href="/"
                  aria-current={pathname === "/" ? "page" : undefined}
                  className="flex min-h-12 items-center rounded-md px-3 text-lg font-medium aria-[current=page]:bg-sunken"
                >
                  Home
                </Link>
              </li>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="flex min-h-12 items-center rounded-md px-3 text-lg font-medium aria-[current=page]:bg-sunken"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-line pt-2">
                <Link href="/sell" className="flex min-h-12 items-center rounded-md px-3 text-base text-ink-muted">
                  Sell your property
                </Link>
              </li>
              <li>
                <Link href="/saved" className="flex min-h-12 items-center rounded-md px-3 text-base text-ink-muted">
                  Saved properties
                </Link>
              </li>
            </ul>
          </nav>
          <div className="flex flex-col gap-2 border-t border-line px-4 pt-4">
            {phoneHref ? (
              <a href={phoneHref} className={buttonClass("secondary", "lg")}>
                <Phone aria-hidden="true" /> Call {phoneLabel}
              </a>
            ) : null}
            <Link href="/contact" className={cn(buttonClass("primary", "lg"))}>
              Send an enquiry
            </Link>
          </div>
        </div>
      </dialog>
    </div>
  );
}
