# Architecture

## Stack (as built)

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16.4** (App Router, React 19.3, TypeScript strict) | Server rendering, server actions, built-in metadata/sitemap |
| Rendering | **Cache Components + Partial Prerendering** (Next 16 default) | Public pages are prerendered from cached DB reads and invalidated on admin edits |
| Styling | **Tailwind CSS v4**, tokens in `src/app/globals.css` | One token source; no runtime CSS-in-JS |
| Database | **PostgreSQL 17** via **Drizzle ORM** + `postgres` driver | Typed queries, SQL migrations in git, works with any Postgres host |
| Auth | Own **DB-backed sessions** + **scrypt** password hashes | See "Deviations" below |
| Photos | `sharp` pipeline → WebP variants → **local disk (dev)** or **S3-compatible bucket (prod)** | Variants made once at upload, so no runtime image optimiser is needed |
| Email | **Resend** HTTP API (optional) | Plain `fetch`, no SDK; failure never affects saved enquiries |
| Tests | **Vitest** (unit + integration on a real Postgres test DB), **Playwright** + **axe-core** (E2E, accessibility) | |
| Hosting | **Render** web service (Node 24), `render.yaml` blueprint | Requested by the business |

No separate backend service: server actions and two route handlers (`/admin/api/media`, `/api/health`) cover everything.

## Deviations from the brief's suggested stack (and why)

- **No Supabase Auth / RLS.** The business will provide its own database and Render account later; the provider is not yet known. Tying auth to Supabase would force that choice. Instead:
  - All data access runs on the server through a small data-access layer; the browser never talks to the database.
  - Every privileged action calls `assertUser()`/`requireUser()`/`requireAdmin()` (`src/lib/auth/dal.ts`), which re-validates the session row in Postgres.
  - Row Level Security is not used because there is a single trusted server role. If Supabase is chosen later, it can still be used purely as Postgres + S3 storage.
- **No shadcn/ui or React Hook Form.** Native `<dialog>`, `<select>` and form validation cover the needs with far less client JavaScript. The shared Zod schemas validate on both client and server.
- **No `next/image` optimiser.** Images are resized once at upload; `<Picture>` emits a `srcset` of the stored variants. This avoids CPU-heavy on-demand resizing on a small Render instance.

## Folder map

```
src/
  app/
    (site)/            public pages (layout = header + footer)
    admin/login/       sign-in (outside the protected layout)
    admin/(panel)/     protected admin pages, `instant = false`
    admin/preview/     full-page preview of unpublished listings
    admin/actions/     server actions (each one authorises itself)
    admin/api/media/   photo upload route handler (XHR, progress)
    actions/enquiry.ts public enquiry server action
    media/[...key]/    serves local-disk photos in development
    api/health/        health check for Render
    sitemap.ts, robots.ts, not-found.tsx
  components/ui/       design-system primitives (button, field, feedback, picture, layout)
  components/site/     public components (header, cards, gallery, filters, enquiry form…)
  components/admin/    admin shell, forms, photo manager
  lib/
    db/                schema, client, connection factory
    auth/              password hashing, sessions, DAL
    queries/public.ts  cached, tagged public reads (published + non-sample only in prod)
    admin/queries.ts   uncached admin reads
    services/          testable domain logic (enquiry save + notify)
    storage/           local + S3 drivers, key safety, public URLs
    validation.ts      Zod schemas shared by client and server
    domain.ts          vocabulary + labels; format.ts INR/area/phone
  proxy.ts             admin cookie gate + real 404s for unknown slugs
drizzle/               SQL migrations (committed)
scripts/               migrate, seed (dev only), create-admin, e2e-setup
tests/                 Vitest unit + integration
e2e/                   Playwright specs
```

## Caching model

- Public reads in `lib/queries/public.ts` use `"use cache"` + `cacheLife("hours")` + `cacheTag(...)`.
- Admin mutations call `updateTag()` (server actions) or `revalidateTag(tag, { expire: 0 })` (upload route), so changes appear immediately.
- Tags: `properties`, `projects`, `services`, `settings`, `localities` (`lib/cache-tags.ts`).
- The cache is in-memory per instance. **Run a single Render instance** (default); with several instances, others refresh within the hourly window. If scaling out, add a shared cache handler (Next `cacheHandlers`).
- **The build reads the database** (it prerenders pages from real data), so migrations run before `next build` (see `render.yaml`).

## Request flow: enquiry

Browser validation (Zod) → server action `submitEnquiry` → Zod again → rate limit (Postgres) → spam heuristics (honeypot, fill time; suspected spam is *saved* as `spam`, never dropped) → verify linked listing is published → **insert** → respond with reference → `after()` sends email and records `notification_status`. An email failure only changes `notification_status`.

## Status codes

With Partial Prerendering, a page's static shell is sent with HTTP 200 before the page can call `notFound()`. `proxy.ts` therefore checks `/properties/:slug` and `/projects/:slug` against the database (60 s in-memory cache) and rewrites unknown slugs to a real 404. If the database is unreachable, it lets the request through and the page renders its own not-found UI with `noindex`.
