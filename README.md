# HKNR — Real Estate & Construction website

Public website and admin dashboard for HKNR, Moula Ali, Secunderabad (Hyderabad).
Next.js 16 · TypeScript · Tailwind CSS 4 · PostgreSQL (Drizzle) · S3-compatible photo storage · hosted on Render.

## Quick start (local)

Requirements: Node 24+, Docker.

```bash
npm install
cp .env.example .env.local          # defaults work with the bundled Docker database
npm run db:up                       # Postgres 17 on localhost:55433
npm run db:migrate
npm run db:seed                     # optional: SAMPLE listings/projects (dev only, clearly labelled)
npm run admin:create -- --email you@example.com --name "Your Name"
npm run dev                         # http://localhost:3000, admin at /admin
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run db:up` | Start local Postgres (Docker) |
| `npm run db:generate` | Create a migration after editing `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed [-- --reset]` | Synthetic sample content (refuses in production) |
| `npm run admin:create -- --email … --name … [--role staff]` | Create a user; prints a one-time password |
| `npm run check` | Typecheck + lint + unit/integration tests |
| `npm run test:e2e` | Playwright E2E + accessibility (production build) |

## Documentation

| Doc | |
| --- | --- |
| [docs/strategy.md](docs/strategy.md) | Positioning, goals, risks |
| [docs/user-personas-and-journeys.md](docs/user-personas-and-journeys.md) | Who the site is for and their main journeys |
| [docs/information-architecture.md](docs/information-architecture.md) | Sitemap, content model, URLs |
| [docs/design-system.md](docs/design-system.md) | Tokens, components, Nielsen heuristics mapping |
| [docs/architecture.md](docs/architecture.md) | Stack, decisions, caching, request flows |
| [docs/database.md](docs/database.md) | Schema semantics, backups, retention |
| [docs/security.md](docs/security.md) | Controls, tests, known limitations |
| [docs/seo-and-marketing.md](docs/seo-and-marketing.md) | SEO implementation, launch checklist, analytics policy |
| [docs/testing-and-qa.md](docs/testing-and-qa.md) | How to test, coverage, latest results |
| [docs/deployment.md](docs/deployment.md) | Render setup, verification, rollback, readiness checklist |
| [docs/admin-guide.md](docs/admin-guide.md) | How staff use the dashboard |
| [docs/business-content-checklist.md](docs/business-content-checklist.md) | Information HKNR must supply or confirm |
| [docs/implementation-roadmap.md](docs/implementation-roadmap.md) | Phase status |

## Content rules

No business information is invented. Contact buttons, address, hours and registrations appear only after an admin enters verified values. Sample data exists only in development, is flagged `is_sample`, and is always hidden when `APP_ENV=production`.
