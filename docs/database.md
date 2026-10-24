# Database

Schema source of truth: `src/lib/db/schema.ts`. Migrations: `drizzle/` (generated with `npm run db:generate`, applied with `npm run db:migrate`).

## Tables

| Table | Purpose | Notes |
| --- | --- | --- |
| `users` | Staff accounts (`admin` / `staff`) | Email unique, lower-cased; scrypt hash; `is_active` |
| `sessions` | Login sessions | PK is SHA-256 of the cookie token; cascades on user delete |
| `localities` | Areas used by listings and filters | Unique name + slug; delete blocked while in use |
| `properties` | Listings | See below |
| `projects` | Construction portfolio | `stage` ongoing/completed, `specifications` JSON list |
| `media` | Photos for properties **or** projects | CHECK: exactly one owner; cascades with owner |
| `services` | Construction services shown publicly | Publication status |
| `enquiries` | Leads | See below |
| `lead_notes` | Internal notes per enquiry | Cascades with enquiry |
| `site_settings` | Single row (id = 1) of verified business details | CHECK id = 1 |
| `audit_logs` | Admin actions | Field names / summaries only |
| `rate_limits` | Fixed-window counters | Self-cleaning |

## Properties: field semantics

- `reference`: `HK-P-0001` from a sequence, never reused. The slug ends with it, so slugs stay unique and **stable when titles change**.
- `price_inr`: `bigint`, **whole rupees** (no floating point). `NULL` + `price_on_request = true` means undisclosed.
  - CHECK: a **published** listing must have a price or be "price on request".
- Areas are kept separate, never interchangeable:
  - `plot_area` + `plot_area_unit` (`sq_yd` | `sq_ft` | `acre`). CHECK: both or neither.
  - `built_up_area_sqft`, `carpet_area_sqft` (always sq ft).
- `address_private` is **never** selected by public queries.
- `status` (draft/published/archived) is separate from `availability` (available/under_offer/sold/rented/unavailable).
- `is_sample`: synthetic seed data. Hidden whenever `APP_ENV=production`, by both the queries and the proxy.

## Enquiries

- `reference` `HK-E-00001` is shown to the visitor as their confirmation.
- CHECK: phone or email must be present.
- `property_id` / `project_id` use `ON DELETE SET NULL`, and `subject_snapshot` keeps the listing reference and title, so a lead keeps its context after a listing is deleted.
- `consent` + `consent_version` record what the visitor agreed to.
- `ip_hash`: salted SHA-256 (truncated). Raw IP addresses are not stored.
- `notification_status`: pending / sent / failed / skipped, plus `notification_error`.

## Indexes

Public catalogue: `(status, availability, published_at)`, `locality_id`, `type`, `price_inr`. Leads: `(status, created_at)`, `assigned_to`, `property_id`. Media: `(property_id, sort_order)`, `(project_id, sort_order)`.

## Deletion rules

- Deleting a property or project deletes its media rows (cascade). Storage files are removed afterwards; a leftover file is harmless, a dangling row isn't.
- A locality can't be deleted while listings use it (`RESTRICT`).
- Deleting a user keeps their content (`created_by`/`updated_by`/`author_id` → NULL). Deactivate rather than delete.

## Seed data (development only)

`npm run db:seed` creates 8 sample properties, 2 projects and 3 services, all `is_sample = true`, with generated images stamped **SAMPLE IMAGE**. The script refuses to run when `APP_ENV=production`. `--reset` removes previous samples.

## Retention (proposed, needs business approval)

Delete or anonymise enquiries 24 months after closure. Not yet automated; admins can delete individual enquiries (e.g. for privacy requests).

## Backups

Use the managed provider's daily backups (Render Postgres paid plans, Supabase and Neon all provide them). Before risky changes, take a manual dump:
`pg_dump "$DATABASE_URL" -Fc -f hknr-$(date +%F).dump`. Restore with `pg_restore -d "$DATABASE_URL" --clean hknr-YYYY-MM-DD.dump`.
