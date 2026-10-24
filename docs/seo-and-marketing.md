# SEO and marketing

## Implemented

- **Per-page titles and descriptions** (`title.template` "… · HKNR"). Listing pages build theirs from type, locality and price.
- **Canonical URLs** on every public page. Every filtered catalogue URL canonicalises to `/properties`.
- **Open Graph**: site name, `en_IN` locale, and the listing's cover photo on detail pages.
- **`/sitemap.xml`**: static pages plus every published listing and project (with `lastModified`). Drafts and production samples are excluded.
- **`/robots.txt`**: blocks everything until `ALLOW_INDEXING=true`. After launch it allows the site and blocks `/admin`, `/saved`, `/media/` and sort-variant URLs.
- **Meta robots**: `noindex` site-wide until launch; always `noindex` on admin, `/saved`, sample listings, not-found pages.
- **Real 404s** for unknown pages and listing slugs.
- **Structured data**: `BreadcrumbList` on listing and project pages. **Not** added yet: `RealEstateAgent`/`LocalBusiness` (needs a verified address, phone and hours) and listing schemas (no Google rich result exists for them, so they would add risk without benefit).
- Clean, stable URLs: `/properties/3-bhk-independent-house-…-hk-p-0007`. The slug doesn't change when the title is edited.
- Image alt text is editable per photo, and the admin UI prompts for it.
- Campaign attribution: `utm_source/medium/campaign` from the landing URL are kept for the session and stored with any enquiry.

## Launch checklist (manual)

1. Connect the domain and set `SITE_URL=https://<domain>` on Render.
2. Confirm that only real content is published. Production hides samples automatically.
3. Set `ALLOW_INDEXING=true` and redeploy.
4. **Google Search Console**: add a Domain property (DNS TXT record), then submit `https://<domain>/sitemap.xml`.
5. **Google Business Profile**: create or claim it for HKNR at the verified Moula Ali address with the same phone and hours as the website. Then add the profile link in Admin → Settings → Social.
6. After the address, phone and hours are verified, add `LocalBusiness` JSON-LD (a small change in `app/(site)/layout.tsx`, using settings).

## Local content guidance

- Write listing descriptions about the actual property and street-level location (in `location note`). Avoid keyword lists.
- **Don't create separate pages per locality** until each has genuinely useful, specific content. Filters already give `/properties?locality=moula-ali` (canonicalised).
- Never invent reviews, ratings, "years of experience", counters or awards.

## Analytics (not installed: needs approval)

No analytics or tracking scripts are on the site, so no cookie banner is needed today. If approved:
- Prefer a privacy-friendly, cookieless tool (e.g. Plausible) or GA4 with consent mode.
- Conversion events to send: `enquiry_submitted` with `{ category }` only, `call_click`, `whatsapp_click`. **Never** names, phones, emails or message text.
- Adding a third-party script requires updating the CSP `script-src`/`connect-src` in `next.config.ts` and the privacy notice.
