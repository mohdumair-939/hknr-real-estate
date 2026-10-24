# Product strategy — HKNR

## What HKNR is (confirmed facts only)

| Fact | Status |
| --- | --- |
| Brand name: HKNR | Confirmed (brief) |
| Category: real estate and construction | Confirmed (brief) |
| Base: Moula Ali, Secunderabad, Hyderabad, Telangana | Confirmed (brief) |
| Phone, WhatsApp, email, hours, address line | **Unknown** — see `business-content-checklist.md` |
| Property inventory, prices, projects, testimonials | **Unknown** — none are published by this build |
| Years in business, registrations (TS-RERA etc.) | **Unknown** |

Everything else on the site is either structural (layouts, forms, workflows) or content the business enters through the admin dashboard.

## Positioning

A locally knowledgeable, organised and transparent property and construction business for Moula Ali and nearby areas. Not a national developer, not a luxury brand. The tone is calm, factual and direct. Trust comes from clear listing details, real photos and easy contact, not from superlatives.

Copy rules:
- No "number one", "most trusted", "leading", "premium developer", invented counters or ratings.
- Every number on the site comes from the database (listing data or admin-entered settings).
- Claims about approvals (HMDA/DTCP/GHMC, RERA), warranties or timelines appear only when an admin enters them for a specific listing or project.

## Business goals → product mechanisms

| Goal | Mechanism |
| --- | --- |
| Genuine enquiries | Enquiry forms on property, project, construction, sell and contact pages; phone/WhatsApp CTAs once numbers are verified |
| Searchable catalogue | `/properties` with server-side filters and shareable URLs |
| Easy phone/WhatsApp contact | Contact actions driven by admin-verified settings; hidden (not faked) until set |
| Construction credibility | Services and projects are admin-managed; empty states instead of invented case studies |
| Lead organisation | Admin lead inbox with statuses, assignment, notes and follow-up dates |
| Local search | Per-page metadata, sitemap, `RealEstateAgent`/`LocalBusiness` JSON-LD only when address and phone are verified |
| Self-service updates | Admin CRUD for properties, projects, services, localities and site settings |
| Future expansion | Typed schema, migrations, storage and email behind interfaces, env-driven configuration |

## Success measures (once live)

- Enquiries per week, split by category (buy / sell / construction / general) and source page.
- Lead response time (created → first status change), visible in admin.
- Share of listings with at least 5 photos and a complete area/price record.
- Search Console: impressions and clicks for Moula Ali / Secunderabad queries.

## Competitor and market research

Live competitor browsing was **not** done in this phase. The design relies on general conventions of the Hyderabad property market rather than observed competitor sites, and these need business confirmation:

- Plots are usually quoted in **square yards** ("gajam"), houses and flats in **square feet**.
- Buyers often filter by **facing** (East/North etc.).
- Approval status (HMDA, DTCP, GHMC) and **TS-RERA** registration strongly affect buyer trust and, for registered projects or agents, are a legal disclosure requirement in advertising.
- Portals (99acres, MagicBricks, Housing.com) set buyer expectations: price, area, BHK, locality and photos up front.

## Main risks

1. **No verified content at launch.** The site works with an empty inventory ("new inventory" states), but marketing value depends on the business supplying listings and photos.
2. **Regulatory disclosure.** If HKNR acts as an agent or promotes RERA-registered projects, registration numbers must be shown. This needs a business or legal decision (checklist item).
3. **Hosting costs.** Render free web services sleep after inactivity (slow first load). A paid instance is recommended for production; this needs approval.
4. **Photo quality.** A listing without good photos converts poorly. The admin guide covers photo standards.
