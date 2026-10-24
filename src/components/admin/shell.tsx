"use client";

import {
  Building2,
  ExternalLink,
  FolderKanban,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Settings,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { logout } from "@/app/admin/actions/auth";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/domain";

type Item = { href: string; label: string; icon: ReactNode; adminOnly?: boolean; badge?: number };

function items(newLeads: number): Item[] {
  return [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/admin/enquiries", label: "Enquiries", icon: <Inbox />, badge: newLeads },
    { href: "/admin/properties", label: "Properties", icon: <Building2 /> },
    { href: "/admin/projects", label: "Projects", icon: <FolderKanban /> },
    { href: "/admin/services", label: "Services", icon: <Wrench /> },
    { href: "/admin/localities", label: "Localities", icon: <MapPinned /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings />, adminOnly: true },
    { href: "/admin/users", label: "Staff accounts", icon: <Users />, adminOnly: true },
    { href: "/admin/activity", label: "Activity log", icon: <History />, adminOnly: true },
  ];
}

function NavList({ role, newLeads }: { role: UserRole; newLeads: number }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <ul className="flex flex-col gap-0.5">
      {items(newLeads)
        .filter((i) => !i.adminOnly || role === "admin")
        .map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={active(i.href) ? "page" : undefined}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-[0.9375rem] text-ink-inverse-muted hover:bg-white/5 hover:text-ivory aria-[current=page]:bg-white/10 aria-[current=page]:text-ivory [&_svg]:size-[1.15rem]"
            >
              <span aria-hidden="true">{i.icon}</span>
              <span className="flex-1">{i.label}</span>
              {i.badge ? (
                <span className="rounded-full bg-bronze px-2 py-0.5 text-xs font-bold text-charcoal">
                  {i.badge}
                  <span className="sr-only"> new</span>
                </span>
              ) : null}
            </Link>
          </li>
        ))}
    </ul>
  );
}

function Footer({ name }: { name: string }) {
  return (
    <div className="space-y-1 border-t border-white/10 pt-4">
      <Link href="/" target="_blank" className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-ink-inverse-muted hover:text-ivory">
        <ExternalLink className="size-4" aria-hidden="true" /> View website<span className="sr-only"> (opens in a new tab)</span>
      </Link>
      <Link href="/admin/account" className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-ink-inverse-muted hover:text-ivory">
        <UserRound className="size-4" aria-hidden="true" /> {name}
      </Link>
      <form action={logout}>
        <button type="submit" className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-ink-inverse-muted hover:text-ivory">
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </button>
      </form>
    </div>
  );
}

export function AdminShell({
  user,
  newLeads,
  children,
}: {
  user: { name: string; role: UserRole };
  newLeads: number;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  useEffect(() => dialogRef.current?.close(), [pathname]);

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="on-dark sticky top-0 hidden h-dvh flex-col bg-charcoal px-3 py-5 lg:flex">
        <Link href="/admin" className="mb-6 px-3 font-display text-xl tracking-[0.08em] text-ivory">
          HKNR <span className="ml-1 font-sans text-xs tracking-normal text-bronze-light">Admin</span>
        </Link>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto">
          <NavList role={user.role} newLeads={newLeads} />
        </nav>
        <Footer name={user.name} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="on-dark sticky top-0 z-(--z-header) flex h-14 items-center justify-between bg-charcoal px-3 text-ivory lg:hidden">
          <Link href="/admin" className="px-2 font-display text-lg tracking-[0.08em]">
            HKNR <span className="font-sans text-xs text-bronze-light">Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            className="inline-flex size-11 items-center justify-center rounded-md hover:bg-white/10"
            aria-label="Open admin menu"
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
        </header>
        <dialog
          ref={dialogRef}
          aria-label="Admin menu"
          onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
          className="on-dark m-0 h-dvh max-h-none w-[min(18rem,85vw)] max-w-none bg-charcoal p-0 text-ivory"
        >
          <div className="flex h-full flex-col px-3 py-3">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="inline-flex size-11 items-center justify-center rounded-md hover:bg-white/10"
                aria-label="Close admin menu"
                autoFocus
              >
                <X className="size-6" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Admin" className="flex-1 overflow-y-auto">
              <NavList role={user.role} newLeads={newLeads} />
            </nav>
            <Footer name={user.name} />
          </div>
        </dialog>
        <main id="main" className={cn("min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8")}>
          {children}
        </main>
      </div>
    </div>
  );
}
