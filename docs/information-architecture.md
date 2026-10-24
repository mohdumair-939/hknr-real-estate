# Information architecture

## Public sitemap

```
/                         Home
/properties               Catalogue (filters in query string)
/properties/[slug]        Property detail
/construction             Construction services + consultation form
/projects                 Project portfolio
/projects/[slug]          Project detail
/about                    About HKNR
/contact                  Contact details + enquiry form
/sell                     List / sell your property with HKNR
/saved                    Saved & recently viewed (browser-only)
/privacy                  Privacy notice (needs legal review)
/terms                    Terms of use (needs legal review)
/sitemap.xml, /robots.txt, /api/health
404 / error pages
```

Primary navigation: **Properties · Construction · Projects · About · Contact**, plus a header action "Enquire" (→ /contact). "Sell your property" sits in the footer and on the home page, which keeps the header at five items.

Mobile: logo + "Call" icon button (only when a phone number is verified) + menu button that opens a full-height drawer.

## Admin sitemap (noindex, auth required)

```
/admin/login
/admin                    Dashboard (real counts only)
/admin/enquiries          Lead inbox (filters: status, category, assignee, search)
/admin/enquiries/[id]     Lead detail, status, assignment, notes, follow-up
/admin/properties         Listing table (status filters, search)
/admin/properties/new
/admin/properties/[id]    Edit + photos + publish controls
/admin/projects           Projects table
/admin/projects/new
/admin/projects/[id]
/admin/services           Construction services (CRUD, order)
/admin/localities         Localities used by listings and filters
/admin/settings           Contact details, hours, socials, about text, notifications   [admin role]
/admin/users              Staff accounts   [admin role]
/admin/activity           Audit log   [admin role]
/admin/account            Change own password
```

## Content model (summary — see `database.md`)

- **Property**: reference, type, transaction, price, areas with units, rooms, facing, construction status, locality, description, features, approvals note, publication + availability, photos.
- **Project**: type, status (ongoing/completed), locality, completion year, summary, description, specifications, photos.
- **Service**: title, summary, body, order, published flag.
- **Locality**: name, slug (drives filters and keeps spelling consistent).
- **Settings**: verified phone, WhatsApp, email, address, hours, map link, socials, about text, notification email, registrations text.

## URL rules
- Slugs are generated from the title plus the reference (`3-bhk-independent-house-moula-ali-hk-p-0007`), so they stay unique and readable.
- Filter URLs use short, stable keys: `type`, `locality`, `min`, `max`, `beds`, `txn`, `q`, `sort`, `page`.
- Filtered catalogue URLs keep their parameters for sharing, and their canonical points at `/properties`.
- An unpublished listing returns 404 publicly; admins see it through `/admin/properties/[id]` preview.
