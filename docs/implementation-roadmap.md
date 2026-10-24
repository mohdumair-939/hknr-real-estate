# Implementation roadmap

Status as of **24 Oct 2026**. ✅ done and verified · 🟡 done, needs business input or manual verification · ⬜ not started

## Phase 0: audit and planning ✅
- Repository was empty; scaffolded Next.js 16.4.
- Strategy, personas/journeys, IA, architecture, database and content checklist written.
- Competitor browsing **not** done (noted in `strategy.md`).

## Phase 1: design system ✅
- Tokens (contrast-checked), typography, primitives, header/footer/mobile nav, cards, gallery, forms, feedback.

## Phase 2: database and security ✅
- 12-table schema with constraints, sequences and indexes; migration `0000_init`.
- DB sessions, roles, DAL, rate limiting, upload pipeline, storage drivers, audit log, security headers.
- Dev seed with clearly marked samples; admin bootstrap script.

## Phase 3: public website ✅
- Home, properties (filters, sort, pagination, chips, mobile sheet), property detail (gallery, facts, enquiry, WhatsApp, related), construction, projects + detail, about, contact, sell, saved/recently viewed, privacy, terms, 404, error.
- 🟡 About, Sell ("what happens next") and legal copy are written from confirmed facts plus reasonable defaults. **The business must approve them.**

## Phase 4: admin ✅
- Dashboard (real counts), enquiries (filters, status, assignment, follow-up, notes, delete), properties (CRUD, duplicate warning, photos with progress/reorder/alt text, preview, publish rules, availability, archive/delete), projects, services, localities, settings (incl. hero image), staff accounts, activity log, account/password.

## Phase 5: SEO and integrations 🟡
- ✅ Metadata, canonicals, sitemap, robots, OG, breadcrumb JSON-LD, UTM capture, indexing switch.
- 🟡 Email notifications built; untested with a real Resend account.
- ⬜ LocalBusiness JSON-LD (waits for verified address/phone/hours).
- ⬜ Analytics (needs approval; see `seo-and-marketing.md`).

## Phase 6: QA and hardening 🟡
- ✅ Typecheck, lint, 67 unit/integration tests, 26 E2E tests incl. axe scans; production build.
- ⬜ Real-device, screen-reader and Lighthouse passes on the deployed site (`testing-and-qa.md`).

## Phase 7: deployment ⬜ (blocked on accounts)
- ✅ `render.yaml`, `.env.example`, health check, migration-in-build, deployment and recovery docs.
- ⬜ Needs: GitHub repo, Postgres URL, S3/R2 bucket, Render service, plan approval.

## Later (not in scope yet)
- MFA for staff; automated enquiry retention clean-up; WhatsApp/SMS notifications; per-locality guide pages once real content exists; multi-instance shared cache.
