# User personas and journeys

Personas are working assumptions derived from the brief, not research findings. Validate them with the business after launch using enquiry data.

## Personas

| # | Persona | Primary need | What the site must give them |
| --- | --- | --- | --- |
| P1 | **Buyer** (family / first-time buyer, Moula Ali–ECIL–Sainikpuri belt) | Find a home or plot within budget and locality | Budget, type, BHK and locality filters; clear price and area; one-tap call/WhatsApp |
| P2 | **Owner wanting to sell/list** | Get HKNR to sell their property | `/sell` form that captures only property type, locality, rough size and contact details |
| P3 | **Plot / independent-house seeker** | Compare plots by size, facing and approval | Plot area in sq yd, facing, approval notes, construction status |
| P4 | **Construction customer** (owns land, wants a house built) | Judge capability, then talk to someone | Services page, genuine projects, consultation form |
| P5 | **Returning visitor** comparing options | Find listings seen before | "Recently viewed" and "Saved" lists kept in the browser, with no account needed |
| P6 | **Administrator** (owner) | Keep listings and content accurate | Fast listing editor, photo uploads, publish/unpublish, settings |
| P7 | **Staff member** handling enquiries | Respond quickly, keep notes | Lead inbox, filters, status, assignment, follow-up dates, notes |

Assumption: most public visitors arrive **on a phone**, often from WhatsApp shares or Google search. Mobile is the primary design target.

## Journeys

### J1 — Search to enquiry (P1, P3)
Home → hero search (type, locality, budget) → `/properties?…` (results, applied-filter chips, count) → card → `/properties/[slug]` → **Call / WhatsApp / Enquire**.
- Filters are in the URL, so Back returns to the same results and the URL can be shared.
- The enquiry form on a listing pre-fills the listing reference; the visitor never retypes it.
- Friction budget: an enquiry needs only name, phone (or email) and an optional message.

### J2 — Construction consultation (P4)
Home → "Construction" section → `/construction` (services, process only if confirmed) → `/projects` → project → "Request a consultation" (category pre-set to construction).

### J3 — Listing detail → WhatsApp
The WhatsApp button opens `wa.me/<verified number>?text=<encoded message with listing ref + URL>`. If no number is verified, the button is not rendered and the enquiry form is the fallback.

### J4 — Contact page
`/contact` → form → inline validation → submit (button disabled, "Sending…") → confirmation panel with a reference and what happens next. On failure, the entered values stay and a specific, retryable message is shown.

### J5 — Owner wants to sell (P2)
Home / footer / header "Sell with HKNR" → `/sell` → short form (category = sell) → confirmation.

### J6 — Admin publishes a listing (P6)
`/admin/login` → dashboard → Properties → New → fill (draft auto-saved on explicit "Save draft") → Photos (upload with progress, reorder, alt text) → Preview → Publish. A duplicate warning appears when another listing has the same locality, type and area.

### J7 — Lead handling (P7)
Dashboard "New enquiries" → lead detail → contact details with tap-to-call → status change (New → Contacted → Follow-up → Qualified → Closed / Spam) → assign → add a note → set a follow-up date.

### J8 — Mark sold / unavailable (P6)
Property list → row action "Change availability" → Sold. A sold listing stays visible with a "Sold" badge only if the admin keeps it published; otherwise unpublish.

## Friction rules
- No account creation for visitors.
- No mandatory fields beyond what is needed to call someone back.
- No pop-ups, interstitials or auto-opening chat widgets.
- Nothing is sent or published without an explicit button press.
