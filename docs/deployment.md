# Deployment (Render)

> **Current setup: free trial plans** (`render.yaml`). The free web service sleeps when idle and the free database is **deleted after 30 days**. Upgrade the web service to Starter and the database to a paid plan before real customers use the site.

Nothing has been deployed yet. Domain purchase is out of scope; the site uses Render's `*.onrender.com` URL until a domain is chosen.

## What you'll need (and what I'll ask you for)

| Item | Recommendation | Cost note |
| --- | --- | --- |
| GitHub repository | Private repo; push this project | Free |
| PostgreSQL | **Render Postgres (Basic plan)** in the same region, or Supabase / Neon | Render's free Postgres **expires after 30 days**, so don't use it for production |
| Photo storage (S3-compatible) | **Cloudflare R2** (free tier, 10 GB, no egress fees) with a public `r2.dev` URL or custom domain; or Supabase Storage (S3 protocol) | Render's own disk is wiped on every deploy and can't be used for photos |
| Render web service | **Starter** instance (stays awake). Free instances sleep and take ~30–60 s to wake | Paid: needs your approval |
| Email (optional) | Resend + a verified sending domain (needs the domain) | Free tier available |

## One-time setup

1. **Database**: create Postgres and copy its *external* (or same-region *internal*) connection string as `DATABASE_URL`.
2. **Bucket** (Cloudflare R2 example):
   - Create bucket `hknr-media`, then enable public access (r2.dev URL) or attach a custom domain → `S3_PUBLIC_BASE_URL`.
   - Create an API token with *Object Read & Write* on that bucket → `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
   - `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_REGION=auto`, `S3_BUCKET=hknr-media`.
3. **Render**: New → Blueprint → select the repo (uses `render.yaml`), or create a Web Service manually with:
   - Build command: `npm ci && npm run db:migrate && npm run build`
   - Start command: `npm start` (Next.js reads Render's `PORT`)
   - Health check path: `/api/health`
   - Environment: Node 24
4. **Environment variables**: see `.env.example`. Production values:
   - `APP_ENV=production`, `STORAGE_DRIVER=s3`, `ALLOW_INDEXING=false` (until launch)
   - `IP_HASH_SALT` = a long random string (the blueprint generates one)
   - `SITE_URL` can stay empty (falls back to `RENDER_EXTERNAL_URL`)
   - Don't set `NODE_ENV`; Render and Next handle it.
5. **First deploy**: the build runs migrations, then builds. **The build needs database access**, because pages are prerendered from real data.
6. **First administrator** (no default account exists). On a paid instance, run in the Render Shell:
   `npm run admin:create -- --email owner@<domain> --name "Owner Name"`.
   On the free plan (no Shell), run it from your own computer against the database's **External Database URL**
   (Render → hknr-db → Connect → External):
   ```bash
   DATABASE_URL="<External Database URL>?sslmode=require" npm run admin:create -- --email owner@<domain> --name "Owner Name"
   ```
   Copy the one-time password, sign in at `/admin/login`, then change it under Account.
7. **Enter verified business details** in Admin → Settings, then add localities, services, listings and projects.

## Verifying a deployment

- `GET /api/health` → `{"ok":true}`
- Home, `/properties`, a listing and `/contact` load; an unknown listing URL returns 404.
- Submit a real enquiry and confirm it appears in Admin → Enquiries (and the email arrives, if configured).
- Upload a photo and confirm its URL starts with `S3_PUBLIC_BASE_URL`.
- `/admin` redirects to login when signed out.
- Response headers include `Content-Security-Policy` and `Strict-Transport-Security`.
- No sample content: production hides it automatically, and the production DB should never be seeded.

## Connecting a domain later

1. Add the custom domain in Render (Settings → Custom Domains) and create the DNS records Render shows.
2. Set `SITE_URL=https://<domain>` and redeploy.
3. When content is ready: `ALLOW_INDEXING=true`, redeploy, then follow the launch checklist in `seo-and-marketing.md`.

## Rollback and recovery

- **Code**: Render → Deploys → "Rollback" to a previous deploy.
- **Database**: migrations are additive. Before any migration that drops or rewrites data, take a `pg_dump` (see `database.md`). Restore from the provider's backups if needed.
- **Photos**: bucket objects are never overwritten (unique keys). Deleted photos are gone, so enable R2/S3 object versioning if you want undo.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Build fails with "Invalid environment configuration" | A required variable is missing; the message lists which |
| Build fails connecting to the DB | Wrong `DATABASE_URL`, or the DB isn't reachable from Render's build (use the external URL or same region) |
| Photos upload but don't display | `S3_PUBLIC_BASE_URL` is wrong or the bucket isn't public; CSP `img-src` is derived from it at build time, so redeploy after changing it |
| Contact buttons missing | Phone/WhatsApp not set in Admin → Settings (intended) |
| Enquiry emails not arriving | Check the enquiry's "Email notification" field in admin: `skipped` = not configured, `failed` = provider error |
| Edits not visible to visitors | Refresh. With more than one instance, other instances refresh within an hour (see architecture.md) |
| Slow first page after idle | Free Render instance waking up; use Starter |

## Production readiness checklist

- [ ] Real `DATABASE_URL` (not the free 30-day DB), with backups enabled
- [ ] S3/R2 bucket configured; test upload verified
- [ ] `APP_ENV=production`, `IP_HASH_SALT` set
- [ ] First admin created; default/temporary password changed
- [ ] Verified contact details entered; notification email set
- [ ] Privacy notice and terms reviewed by the business (and ideally a lawyer)
- [ ] TS-RERA / registration details decided (see checklist)
- [ ] At least one genuine listing published, with photos
- [ ] `npm run check` and `npm run test:e2e` pass on the release commit
- [ ] Health check green; enquiry end-to-end verified on the live URL
- [ ] `ALLOW_INDEXING` switched on only after real content is live
