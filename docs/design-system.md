# Design system

Tokens live in `src/app/globals.css` (`@theme`). Components use token classes (`bg-charcoal`, `text-ink-muted`, `border-line`), never raw hex values (the only exception is the WhatsApp button green, which is documented inline).

## Colour

| Token | Hex | Use | Contrast (measured) |
| --- | --- | --- | --- |
| `charcoal` | #242522 | Primary buttons, footer, admin sidebar | ivory on charcoal **13.7:1** |
| `ivory` | #F5F1E9 | Page bands, text on charcoal | |
| `canvas` | #FAF8F4 | Page background | |
| `surface` | #FFFFFF | Cards, forms | |
| `ink` | #252620 | Body text | 15.3:1 on white |
| `ink-muted` | #68685F | Secondary text | 5.6:1 white · 5.0:1 ivory |
| `bronze` | #B49A70 | Rules, markers, selection; text **only on charcoal** | 2.7:1 on white ✗ (never text) · 5.7:1 on charcoal |
| `bronze-ink` | #7A6240 | Bronze-coloured text on light backgrounds | 5.8:1 white · 5.1:1 ivory |
| `bronze-light` | #C9B48F | Bronze text on charcoal | 7.6:1 |
| `line` | #E6E1D8 | Decorative dividers | |
| `line-strong` | #8F8878 | Form control borders (WCAG 1.4.11) | 3.5:1 |
| `danger` / `success` / `warning` | #9B2C2C / #1F6B45 / #8A5A00 | Feedback (always with icon + text) | 7.5 / 6.5 / 5.9:1 |
| `focus` | #1F4FBF | 2px focus ring, all interactive elements | |

## Typography

- **Newsreader** (variable, optical sizing), weight 400: display and section headings only (`.text-display`, `.text-h1`, `.text-h2`).
- **Manrope** (variable): body, UI, forms, admin.
- Both are self-hosted by `next/font` with `display: swap`, so no layout shift from late-loading fonts.
- Fluid scale with `clamp()` between 320px and 1280px. Body text is 16px with line-height 1.6. The `.text-eyebrow` label is 12px, uppercase, 0.14em tracking.

## Space and layout

- Tailwind's 4px scale. Sections use `py-16 md:py-24`; cards use `p-4 sm:p-5`.
- `.container-page`: 76rem maximum width, 16px gutters on phones (respecting safe-area insets) and 32px from 768px.
- Prose is capped at 42rem.

## Shape and elevation

Radii: `xs` 2px (badges), `sm` 4px, `md` 6px (cards, buttons, inputs), `lg` 10px (sheets). Three shadows: `card`, `raised`, `overlay`. Most separation comes from 1px `line` borders, not shadows.

## Components (`src/components/ui`)

| Component | Notes |
| --- | --- |
| `Button`, `ButtonLink`, `ButtonAnchor` | primary / secondary / ghost / inverse / danger / whatsapp; sm 36px, **md 44px**, lg 48px tall; `pending` shows a spinner and disables the button |
| `Field` + `Input` / `Select` / `Textarea` / `Checkbox` | Label, hint and error wired via `aria-describedby`; `aria-invalid` styling; 44px minimum height; 16px text (prevents iOS zoom) |
| `Alert`, `Badge`, `SampleBadge`, `EmptyState` | Tone conveyed by icon + text, never colour alone |
| `Picture`, `NoPhoto` | srcset from stored variants, blur placeholder, explicit width/height (no CLS) |
| `SectionHeading`, `PageHeader`, `Breadcrumbs` | Consistent heading semantics |

Site components: header with mobile `<dialog>` drawer, footer, `PropertyCard` (the whole card is a link via a stretched pseudo-element, with the Save button layered above), `Gallery` (dialog lightbox with arrow keys), catalogue filters (desktop sidebar applies instantly; mobile bottom sheet applies on "Show results"), `EnquiryForm`, `ContactActions`.

## Interaction states

Every control has hover, `:focus-visible` (2px blue ring, 2px offset; ivory on dark backgrounds), active, disabled (55% opacity + not-allowed cursor), and loading (`aria-busy` + spinner). Motion: 120–200ms colour/opacity transitions and a gentle image zoom on card hover. All motion is disabled under `prefers-reduced-motion`.

## Imagery rules

- Real HKNR photos only for real listings and projects. The seed's placeholder images are stamped "SAMPLE IMAGE".
- No photo yet: neutral "Photos coming soon" tile, not a stock image.
- Hero: an admin-uploaded photograph, or else a line-drawn elevation that clearly isn't a property photo.
- Uploads are decoded and re-encoded to WebP at 480/960/1600/2400px (never upscaled), auto-rotated, with EXIF/GPS stripped.

## Logo

There is no approved logo yet. `Wordmark` (`components/site/brand.tsx`) is a typographic placeholder; replace its contents when files are supplied.

## Nielsen heuristics: where they are implemented

| # | Heuristic | Concrete implementation | Verified by |
| --- | --- | --- | --- |
| 1 | System status | Pending buttons with spinner; results dim + "Updating…" while filters apply; per-file upload progress; enquiry reference on success; Draft/Published/Sold badges | E2E admin + contact specs |
| 2 | Real-world match | ₹ lakh/crore formatting; sq yd vs sq ft; built-up vs carpet vs plot area with hints; "Facing"; BHK | Unit tests (format) |
| 3 | Control & freedom | Filter chips with ×, "Clear all"; Back keeps filters (URL state); Cancel on admin forms; confirm dialogs for publish/unpublish/delete; archive before delete | E2E |
| 4 | Consistency | Shared tokens and components across public and admin; one focus style; one badge vocabulary | Review |
| 5 | Error prevention | Client + server Zod; publish checklist; DB CHECK constraints; duplicate-listing warning; unsaved-changes warning; enquiry phone normalisation | Unit + integration |
| 6 | Recognition over recall | Applied-filter chips, result count, options showing listing counts, "Enquiring about: HK-P-…" | E2E |
| 7 | Flexibility | Shareable filter URLs, sort, keyword search by reference, Call/WhatsApp straight from listings, quick availability buttons in admin | E2E |
| 8 | Minimalist design | Five nav items; progressive disclosure of fields by property type; advanced filters in a sheet on mobile | Screens |
| 9 | Error recovery | Plain-language messages tied to fields; values preserved after failures; specific rate-limit and server messages; no stack traces | Integration tests |
| 10 | Help | Field hints, area explanations on detail pages, admin guide, helpful empty states | Review |
