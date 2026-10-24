# Testing and QA

## How to run

```bash
npm run db:up        # Postgres in Docker (creates hknr, hknr_test, hknr_e2e on first start)
npm run typecheck    # next typegen + tsc --noEmit
npm run lint         # ESLint (next/core-web-vitals + typescript)
npm test             # Vitest: unit + integration against hknr_test
npm run test:e2e     # Playwright: builds a production bundle against hknr_e2e, then runs desktop + mobile
npm run check        # typecheck + lint + unit/integration
```

If the database was created before `hknr_e2e` was added to `scripts/docker-init.sql`, create it once:
`docker compose exec db psql -U hknr -d postgres -c "CREATE DATABASE hknr_e2e OWNER hknr"`.

Integration tests refuse to run unless the database name ends in `_test`; E2E setup refuses unless it ends in `_e2e`.

## What is covered

**Unit** (`tests/unit`): INR and area formatting, phone normalisation, WhatsApp URL encoding, slugs; enquiry/property/settings validation; filter parsing and canonical URLs; publish rules.

**Integration** (`tests/integration`, real Postgres):
- Enquiries: saved with reference and hashed IP; invalid input saves nothing and echoes the values back; spam kept as `spam`; rate limit; unpublished property link dropped; **email failure or a throwing sender never loses the enquiry**; no contact details in the email.
- Authorisation: anonymous and staff restrictions, forged cookie, last-admin protection, deactivation revokes sessions, login timing/message parity, off-site redirect blocked.
- Public queries: drafts never public; samples hidden in production; filters by type, locality, budget, bedrooms; sold listings sort last; search wildcards escaped; facets from published data only.
- Images and limits: non-images and tiny images rejected, EXIF stripped, WebP variants; storage key traversal; rate limiter; password hashing.

**End-to-end** (`e2e/`, production build, Chromium desktop + Pixel 7):
- Admin: anonymous redirects + 401 on upload; wrong password; full journey from settings → create (validation first) → upload photo with progress → alt text → publish → catalogue filters → detail page with WhatsApp link → visitor enquiry → staff status + note → mark sold → unpublish → gone from the site.
- Public: all pages return 200 with no horizontal overflow (desktop, Pixel 7, and 320px); real 404s; empty-inventory state; contact validation + success reference; mobile menu focus and Escape; robots closed; security headers; **axe WCAG 2.2 AA scan, zero serious or critical violations** on home, properties, contact, construction.

## Latest results (24 Oct 2026, local)

| Check | Result |
| --- | --- |
| `tsc --noEmit` | pass |
| ESLint | pass (0 problems) |
| Vitest | **67 / 67 passed** |
| Playwright | **26 passed, 1 skipped** (the mobile-only menu test is skipped in the desktop project by design) |
| Production build (`next build`) | pass |

## Manual QA still to do before launch

- Real devices: an Android mid-range phone on 4G and an iPhone (Safari). Check upload from the camera roll, keyboard types, and the sticky mobile action bar above the home indicator.
- Screen reader pass (NVDA + Chrome, VoiceOver + Safari) on: catalogue filters, gallery dialog, enquiry form errors, admin photo manager.
- 200% browser zoom on the catalogue and the admin property editor.
- Lighthouse on the deployed URL (performance numbers from a local machine are not representative).
- Email notification with a real Resend key and a verified domain.
- Upload to the real S3/R2 bucket and confirm images load from `S3_PUBLIC_BASE_URL`.

## Responsive targets

Verified automatically at 320px, 1280px (desktop project) and Pixel 7 (412px). Spot-checked by screenshot at 375px and 1280px during development. Remaining widths (360, 390, 430, 768, 1024, 1440+) should be included in the manual pass above.
