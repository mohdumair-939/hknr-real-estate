# Business content checklist

Nothing below is invented on the site. Until an item is confirmed, the related UI is **hidden or shows an honest empty state**. Most items are entered by an admin in `/admin/settings` or the content screens, so no code change is needed.

Legend: ☐ not yet supplied · ☑ supplied and verified

## Contact and identity
- ☐ Official phone number (shown in the header, footer, contact page, and as a tap-to-call link)
- ☐ Official WhatsApp number (if different from the phone)
- ☐ Official email address (public)
- ☐ Notification email for new enquiries (internal; can differ from the public email)
- ☐ Full business address, and whether to show it publicly
- ☐ Opening hours (e.g. Mon–Sat 10:00–19:00)
- ☐ Google Maps link for the office, if the location should be shown
- ☐ Approved logo files (SVG preferred) and any brand colours/fonts already in use
- ☐ Legal entity name (e.g. "HKNR Real Estate & Constructions" / proprietorship / LLP / Pvt Ltd), used in the footer copyright and privacy notice
- ☐ Social profiles (Instagram, Facebook, YouTube, Google Business Profile)

## Regulatory (needs business/legal decision)
- ☐ Does HKNR act as a **real estate agent** for third-party properties? If yes: **TS-RERA agent registration number** (must appear on advertisements)
- ☐ For any project HKNR develops/sells that needs registration: **TS-RERA project registration number** for each project
- ☐ GSTIN (only if the business wants it shown)
- ☐ Construction licences/registrations, if any, and whether to display them
- ☐ Approval types to describe on listings (HMDA / DTCP / GHMC / other), entered per listing

## Inventory
- ☐ Current properties available: type, locality, price (or "price on request"), plot area (sq yd), built-up/carpet area (sq ft), bedrooms, bathrooms, facing, status, approvals
- ☐ At least 5 genuine photos per listing (see photo standards in `admin-guide.md`)
- ☐ Which transaction types are offered: sale only, or also rent/lease?
- ☐ Property categories actually offered (currently modelled: residential plot, independent house, apartment, villa, commercial — unused types never appear in filters)
- ☐ Localities actually served beyond Moula Ali (e.g. ECIL, Sainikpuri, Malkajgiri, Kapra, AS Rao Nagar, Nacharam, Uppal, Kushaiguda?) — **none are assumed**

## Construction
- ☐ Services actually offered (new house construction, turnkey, structure-only, renovation, planning/consultation, interiors?)
- ☐ The real process HKNR follows (site visit → estimate → agreement → …), if the business wants it published
- ☐ Completed/ongoing projects with genuine photos, locality, year, and a short description
- ☐ Permission from clients to show their projects

## About and trust
- ☐ Short company background (founder/owner name(s) only if they want to be named)
- ☐ Year established (optional)
- ☐ Team/office photos (optional)
- ☐ Approve the default website copy written from confirmed facts: home hero line, About page ("How we work with you": clear listings, details not shared, no pressure), Sell page "What happens next" steps, Construction "Helpful to have ready" list
- ☐ Testimonials: **only with written permission**, with the customer's name or initials as they approve

## Privacy and data
- ☐ Who at HKNR handles enquiries (names/roles for staff accounts)
- ☐ How long enquiry data should be kept (proposed default: 24 months, then deleted or anonymised)
- ☐ Whether enquiries may be used for follow-up marketing (proposed default: **no**; only to answer the request)
- ☐ Contact for privacy requests (email)
- ☐ Legal review of `/privacy` and `/terms` (drafted against the actual data flows; Digital Personal Data Protection Act 2023 applies)

## Accounts needed at deployment (provided later by the business)
- ☐ PostgreSQL database URL
- ☐ S3-compatible storage bucket for photos (Cloudflare R2 or Supabase Storage recommended) + keys
- ☐ GitHub repository
- ☐ Render account / service
- ☐ (Optional) Resend account + verified sending domain for email notifications
- ☐ (Optional) Google Search Console, Google Business Profile, analytics
