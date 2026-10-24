# Security and privacy

## Controls in place

| Area | Control | Where |
| --- | --- | --- |
| Authentication | scrypt (N=2^15, r=8) password hashes; uniform timing for unknown emails; 12-character minimum | `lib/auth/password.ts`, `admin/actions/auth.ts` |
| Sessions | 32-byte random token in an `httpOnly`, `SameSite=Lax`, `Secure` cookie (`__Host-` prefix in production); only its SHA-256 is stored; 7-day expiry; deleted on logout, password change and deactivation | `lib/auth/session.ts` |
| Authorisation | Every admin page, action and route handler re-checks the session in the DB; admin-only operations (settings, users, permanent deletes, activity log) check the role server-side. The proxy cookie check is only a convenience | `lib/auth/dal.ts`, `admin/actions/*` |
| Brute force | Login: 10 attempts / 15 min per IP hash and 8 per email | Postgres rate limiter |
| No self-registration | Accounts are created by an admin or by `npm run admin:create`; no default password exists | `scripts/create-admin.ts` |
| Input validation | Zod on client and server for every form; strict UUID/slug checks on route params | `lib/validation.ts` |
| Output encoding | React escaping; JSON-LD escapes `<` | `lib/json-ld.tsx` |
| SQL injection | Parameterised Drizzle/postgres.js queries; LIKE wildcards escaped in search | `lib/queries/*` |
| CSRF | Server Actions enforce same-origin; the upload handler compares `Origin` with the host; cookies are `SameSite=Lax` | `admin/api/media/route.ts` |
| Uploads | ≤15 MB; decoded by sharp (extension/MIME ignored); JPEG/PNG/WebP/AVIF only; ≥400px; 60 MP pixel cap; re-encoded to WebP with metadata (incl. GPS) stripped; server-generated random keys; 120 uploads/hour per user | `lib/images.ts` |
| Storage paths | Keys are generated server-side and validated (`assertSafeKey`); the local media route accepts only an exact key pattern and checks the resolved path stays in the root | `lib/storage/*`, `app/media` |
| Public data | Public queries select explicit columns; `address_private`, lead data and unpublished/sample rows are never returned | `lib/queries/public.ts` |
| Spam | Honeypot + minimum fill time (suspected spam saved as `spam`, not dropped); 5 enquiries / 10 min and 20 / day per IP hash | `app/actions/enquiry.ts` |
| Headers | CSP (self only; images from the bucket origin), HSTS (prod), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, no `X-Powered-By`; `X-Robots-Tag: noindex` on /admin | `next.config.ts` |
| Errors | Users get plain-language messages; internals are logged server-side without secrets or contact details | `admin/actions/_shared.ts` |
| Secrets | Validated env (`lib/env.ts`); no `NEXT_PUBLIC_` secrets; `.env*` git-ignored except `.env.example` | |
| Audit | Admin actions logged with field names only, never values, passwords or contact details | `lib/audit.ts` |
| Privacy | IPs stored only as salted hashes; email notifications contain no contact details or message text | `lib/request.ts`, `lib/services/enquiries.ts` |

## Verified by automated tests

- Anonymous users can't create, edit or delete listings, change settings or update leads (integration).
- Staff can't delete listings or leads, change settings or manage accounts (integration).
- A forged session cookie is rejected (integration).
- Private admin URLs redirect to login; the upload endpoint returns 401 without a session (E2E).
- Drafts and (in production) sample listings never appear in public queries (integration).
- A failed or throwing email notification leaves the enquiry saved (integration).
- Uploads reject non-images and tiny images, and strip EXIF (integration).
- Off-site `?next=` redirects after login are ignored (integration).
- Security headers present (E2E).

## Known limitations and decisions needing approval

- **CSP allows `'unsafe-inline'` scripts.** Per-request nonces would force every page to render dynamically and lose prerendering. Mitigated by React's escaping and no third-party scripts. Revisit if analytics or other third-party scripts are added.
- **Photos in a public bucket.** Draft-listing photos are reachable only via unguessable random UUID URLs, and aren't linked anywhere public. If draft photos must be strictly private, switch to signed URLs for admin views.
- **IP detection** trusts `cf-connecting-ip` / `x-forwarded-for` as set by Render's edge. Behind a different proxy, review `lib/request.ts`.
- **No MFA** for staff. Recommended later if more staff accounts are created.
- **Legal:** the privacy notice and terms are drafts written to match actual behaviour. They are **not** legal advice and need review under India's DPDP Act 2023.
- **Retention** of enquiries is not automated yet (proposed: 24 months).

## Operations

- Rotate `IP_HASH_SALT` only if needed. Rotating resets rate-limit history; nothing else breaks.
- To revoke all sessions: `DELETE FROM sessions;`.
- `npm audit` reported 0 vulnerabilities at install time (24 Oct 2026). Re-run before each deploy.
