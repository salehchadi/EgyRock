# EgyRock — Agentic Build Playbook

A sequence of prompts to paste into an agentic coding IDE (Claude Code, Cursor, Windsurf, etc.), one phase at a time, in order. This follows a standard SDLC: requirements → architecture → environment → data layer → core features → admin → hardening → deployment.

## How to use this file

- Paste **one phase at a time**. Let the agent finish, run the app, and check the "before moving on" box before pasting the next phase.
- Phase 0 creates living spec files (`PROJECT_SPEC.md`, `ARCHITECTURE.md`, `AGENTS.md`). Every phase after that tells the agent to re-read those files first — this is what keeps a long, multi-session build consistent instead of drifting.
- Replace anything in `[brackets]` before pasting.
- If a phase produces something you don't like, don't move on — iterate in-place first. Fixing phase 3 after phase 9 is built is much more expensive than fixing it before phase 4 starts.

## Tech stack snapshot

| Layer    | Choice                                                                    |
| -------- | ------------------------------------------------------------------------- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS, hosted on Vercel        |
| Backend  | Next.js API routes / Vercel serverless functions                          |
| Database | Google Sheets (via `googleapis`), accessed only server-side               |
| Auth     | NextAuth.js — credentials-based, customer + admin roles                   |
| i18n     | `next-intl` — English, Arabic (RTL), French                               |
| Payments | Manual InstaPay: customer uploads receipt → admin confirms in admin panel |

---

## Phase 0 — Requirements lock-in

**Goal:** turn everything decided so far into written specs the agent (and any future agent session) will treat as source of truth.

```
Create three files at the project root: PROJECT_SPEC.md, ARCHITECTURE.md, and AGENTS.md. Do not write any application code yet — this phase is documentation only.

PROJECT_SPEC.md should capture, in full detail:
- Project: EgyRock, an ecommerce site for physical products in 4 categories: Courses, T-shirts, Mugs, Accessories. All products are physical (shipped), including courses.
- Every product has: name, description, price, quantity, category, images — all editable by an admin from the interface, with no code changes required. Category names themselves are also editable, and new categories can be added from the interface.
- Stock logic: quantity is the single source of truth. quantity = 0 shows "Out of stock". quantity below an admin-configurable low-stock threshold shows a countdown state ("Only X left"). Otherwise shows "In stock". Stock is NOT decremented when an item is added to cart — only when an admin confirms a payment (see checkout flow below).
- Checkout flow (manual InstaPay): customer adds items to cart → proceeds to checkout → sees the store's InstaPay handle and the order total → uploads a screenshot of their payment receipt → order is created with status "Pending payment" → admin reviews the receipt in the admin panel and marks the order "Confirmed" (this is the only point stock quantity decreases) or "Rejected".
- Auth: customers can sign up / log in to place orders and view order history. A separate admin role can log into an admin panel.
- Internationalization: English, Arabic, French. Arabic must render right-to-left. Every product field (name, description) and every UI label must be translatable and editable by the admin — not hardcoded.
- Homepage: a hero section with 3 scrolling/rotating images, each fully editable (replaceable image + optional link) by the admin.
- Admin capabilities (all from the UI, no code/redeploy needed): add/edit/delete products and categories, edit stock quantities and low-stock threshold, manage homepage hero images, manage translations for UI strings, view and confirm/reject orders.
- Visual identity: "Cairo Underground" direction — rock-music/band-poster and streetwear aesthetic, not a generic SaaS/AI-template look. Key elements: condensed bold display type for headings (e.g. Anton) paired with a structured sans for body/labels (e.g. Oswald), dark charcoal base (#1c1a17), warm coral/orange accent (#e0562c), subtle diagonal screen-print-style texture in hero/banner areas, stock-status shown as poster-stamp-style badges (green outline = in stock, amber outline = "X left" countdown, red outline + dimmed card = out of stock), no gradients, no generic rounded-card-on-white look. For Arabic, pair with a display Arabic font of similar weight/energy (e.g. Cairo or Almarai) rather than a default system font, so the brand doesn't flatten in RTL.

ARCHITECTURE.md should capture:
- Stack: Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel. next-intl for i18n/RTL. NextAuth.js for auth.
- Data layer: Google Sheets as the database, accessed ONLY from server-side code (API routes / server actions) via a service account and the googleapis library — the frontend never calls Google Sheets directly.
- Proposed sheet/tab structure: Products (id, category_id, name_en, name_ar, name_fr, desc_en, desc_ar, desc_fr, price, quantity, images, created_at), Categories (id, name_en, name_ar, name_fr), Orders (id, user_id, items_json, total, status, receipt_image_url, created_at, confirmed_at), Users (id, email, password_hash, role), HomepageImages (id, image_url, link_url, sort_order), Translations (key, en, ar, fr).
- A thin server-side "data access layer" module per entity (e.g. lib/data/products.ts) so Google Sheets can later be swapped for a real database without rewriting the app — all reads/writes go through these modules, never raw sheet calls scattered in route handlers.
- Folder structure convention for App Router with locale segments ([locale]/...), API routes, admin routes, and shared components.
- Environment variables needed (list them: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID, NEXTAUTH_SECRET, NEXTAUTH_URL) with no real values.

AGENTS.md should be a short file (this is what agentic coding tools read automatically at the start of every session) that says: "Before doing any work in this repo, read PROJECT_SPEC.md and ARCHITECTURE.md in full. Follow the conventions and data access layer pattern described there. Do not invent new product fields, statuses, or admin capabilities not listed in PROJECT_SPEC.md without flagging it first." Also copy this same file to CLAUDE.md so both tools pick it up.

After creating these three files, show me their contents so I can review before we write any code.
```

**Before moving on:** read all three files yourself. This is the cheapest point to fix a misunderstanding — fix it here, not five phases from now.

---

## Phase 1 — Environment & repo scaffold

```
Read AGENTS.md, PROJECT_SPEC.md, and ARCHITECTURE.md first.

Scaffold a new Next.js (App Router) + TypeScript project named egyrock. Set up:
- Tailwind CSS
- ESLint + Prettier with a pre-commit hook (husky + lint-staged)
- Folder structure per ARCHITECTURE.md, including an empty lib/data/ directory for the data access layer
- A .env.example file listing the environment variables from ARCHITECTURE.md (no real values)
- A basic README.md with setup instructions (install, env vars, run dev server)
- Git initialized with a sensible .gitignore (node_modules, .env, .next, etc.)

Do not build any features yet. Confirm the app runs with a blank starter page before continuing.
```

**Before moving on:** `npm run dev` works and shows a blank page with no errors.

---

## Phase 2 — Design tokens & theme

```
Read AGENTS.md and PROJECT_SPEC.md, specifically the "Visual identity" section.

Set up the design system as reusable Tailwind config + CSS variables, not one-off inline styles:
- Color tokens: charcoal base (#1c1a17), off-white text (#f2ede4), coral accent (#e0562c), plus the three status colors used for stock badges (in-stock green, countdown amber, out-of-stock red) — pick specific hex values and document them in ARCHITECTURE.md.
- Typography: load Anton (display headings) and Oswald (body/labels) via next/font for Latin locales, and a comparable-weight Arabic display font (e.g. Cairo or Almarai) for the Arabic locale. Set up the font-switching so the correct pair loads per active locale.
- A reusable "poster stamp" badge component (rounded pill or angled tag, colored outline + text, used later for stock status).
- A reusable diagonal screen-print texture background utility (CSS, not an image) that can be applied to hero/banner sections.
- Build a single /style-guide page (dev-only route) that renders all color swatches, both font pairings, and the stamp badge in its three states, so we can visually review the design system in isolation before it's used across real pages.
```

**Before moving on:** open `/style-guide` and confirm it actually looks like the Cairo Underground direction we agreed on — not a generic dark theme.

---

## Phase 3 — Internationalization & RTL scaffolding

```
Read AGENTS.md and ARCHITECTURE.md.

Set up next-intl with three locales: en, ar, fr. Locale-based routing via [locale] segment. Arabic must set dir="rtl" on the html element and the layout must be verified to actually mirror correctly (nav, cards, icons) — not just flip text.

Create a locale switcher component in the header. Seed a minimal translations file per locale with placeholder keys for common UI strings (nav, buttons, stock statuses). Build one placeholder page in all three locales to confirm routing, RTL layout, and font-switching (from Phase 2) all work together correctly before any real features are built on top.
```

**Before moving on:** visiting `/ar` actually mirrors the layout and uses the Arabic display font, not just translated text in an LTR layout.

---

## Phase 4 — Data access layer (Google Sheets)

```
Read AGENTS.md and ARCHITECTURE.md, specifically the sheet structure and data access layer pattern.

Implement the Google Sheets connection server-side only, using a service account (env vars from .env.example). Create the sheet tabs described in ARCHITECTURE.md if they don't exist, with header rows matching the schema.

Build the data access layer modules (lib/data/products.ts, categories.ts, orders.ts, users.ts, homepageImages.ts, translations.ts) with typed CRUD functions (getAll, getById, create, update, delete as applicable). Add basic write-safety: validate required fields before writing, and handle the case where a write fails or the sheet is temporarily unreachable, returning a clear error rather than a silent failure.

Write a small seed script (scripts/seed.ts) that populates a few sample products across all 4 categories, 3 homepage images, and base translation keys, so later phases have real data to build against instead of empty sheets.
```

**Before moving on:** run the seed script, then write a temporary test route that fetches and logs products from the sheet, confirming the connection actually works end to end.

---

## Phase 5 — Authentication

```
Read AGENTS.md and PROJECT_SPEC.md, specifically the "Auth" section.

Implement NextAuth.js with credentials-based login backed by the Users data access module (password hashing with bcrypt). Support two roles: customer and admin. Build sign-up and login pages (localized, in the site's visual style from Phase 2 — not default NextAuth UI). Protect a placeholder /admin route so only role=admin can access it, redirecting everyone else. Add a simple "my account" page showing the logged-in user's email and a placeholder order history section.
```

**Before moving on:** confirm a non-admin account is actually blocked from `/admin`, not just hidden from navigation.

---

## Phase 6 — Homepage

```
Read AGENTS.md, PROJECT_SPEC.md, and reuse the design tokens from Phase 2.

Build the homepage: a hero section that rotates through the 3 homepage images from the HomepageImages sheet (auto-advancing carousel with manual prev/next controls), each image optionally linking somewhere. Below the hero, show a "shop by category" section (Courses, T-shirts, Mugs, Accessories) pulling live category names/data from the sheet — not hardcoded — since category names must remain admin-editable. Apply the Cairo Underground visual language (texture, stamp-style category badges if relevant, typography from Phase 2). Must work correctly in all 3 locales including RTL.
```

**Before moving on:** confirm changing an image or category name directly in the Google Sheet reflects on the homepage without a code change (may need a page refresh — that's fine at this stage).

---

## Phase 7 — Product catalog & stock status

```
Read AGENTS.md and PROJECT_SPEC.md, specifically the "Stock logic" section.

Build the product listing page (filterable by category) and product detail page, pulling from the Products data access layer. Implement the stock-status logic as a single shared utility function (not duplicated per component): quantity 0 → out of stock, quantity < threshold → countdown ("Only X left"), else in stock. Render this using the poster-stamp badge component from Phase 2. Out-of-stock products should visually dim and disable "add to cart". All product text (name, description) must render in the active locale, falling back sensibly if a translation is missing.
```

**Before moving on:** manually edit a quantity to 0 and to a low number in the sheet, refresh, and confirm the badge states actually change correctly.

---

## Phase 8 — Cart

```
Read AGENTS.md and PROJECT_SPEC.md.

Implement a cart using client-side state (persisted in localStorage is fine for the cart itself — not for stock counts) with a cart icon/count in the header, a cart drawer or page showing line items, quantity adjustment, removal, and running total. Enforce that a customer cannot add more of an item to the cart than the current available quantity. Reiterate: adding to cart must NOT decrement the sheet's stock quantity — that only happens on admin payment confirmation (Phase 9/10).
```

**Before moving on:** confirm stock quantity in the sheet is unchanged after adding items to cart.

---

## Phase 9 — Checkout & manual InstaPay flow

```
Read AGENTS.md and PROJECT_SPEC.md, specifically the "Checkout flow (manual InstaPay)" section — follow it exactly.

Build the checkout page: order summary, shipping details form, and a payment step showing the store's InstaPay handle/number and the total to send. Add a receipt upload (image file) — store it (e.g. Vercel Blob or another free/simple storage option — propose one and confirm before implementing) and create an order via the Orders data access module with status "Pending payment", storing the receipt URL, items, and total. Show the customer an order confirmation screen and add the order to their account's order history with its current status.

Do not decrement stock at this stage — that is Phase 10, admin-side only.
```

**Before moving on:** place a full test order and confirm it appears with status "Pending payment" in the Orders sheet, receipt image included.

---

## Phase 10 — Admin panel

```
Read AGENTS.md and PROJECT_SPEC.md, specifically the "Admin capabilities" list — implement all of them.

Build the admin panel (protected by the admin role from Phase 5) with sections for:
1. Products — add/edit/delete, set price/quantity/images, assign category
2. Categories — add/edit/delete, rename
3. Orders — list with status filter, view uploaded receipt, Confirm or Reject each pending order. Confirming an order is the ONLY action that decrements product stock quantities (decrement by the quantities in that order, atomically enough to avoid double-decrementing if clicked twice).
4. Homepage images — replace/reorder the 3 hero images and their links
5. Translations — edit any UI string or product field translation across en/ar/fr from a table-style interface, no code access needed

Keep the admin UI functional and clear rather than matching the storefront's poster aesthetic exactly — clarity matters more than brand here.
```

**Before moving on:** confirm the full loop works — set a product's quantity low, place an order as a customer, confirm it as admin, and verify the quantity actually decremented and the stock badge updates on the storefront.

---

## Phase 11 — Testing

```
Read AGENTS.md and ARCHITECTURE.md.

Add automated tests:
- Unit tests (Vitest or Jest) for the stock-status utility, cart quantity logic, and data access layer functions (mocking the Sheets API)
- Integration tests for the checkout → pending order → admin confirm → stock decrement flow
- A handful of end-to-end tests (Playwright) covering: browse products in all 3 locales, add to cart, complete checkout, admin confirms an order

Set up a test script in package.json and confirm all tests pass.
```

**Before moving on:** all tests green locally.

---

## Phase 12 — Security & validation hardening

```
Read AGENTS.md and ARCHITECTURE.md.

Review and harden: server-side validation on every write endpoint (products, orders, users) — never trust client input. Rate-limit the login and checkout endpoints. Ensure admin routes and admin API endpoints check role server-side, not just hide UI client-side. Sanitize/validate uploaded receipt images (file type, size limit). Confirm no Google service account credentials or secrets are ever exposed to the client bundle. Add CSRF protection where relevant for state-changing requests.

Summarize what you changed and flag anything you think still needs attention.
```

**Before moving on:** read the summary carefully — this is the phase most worth your own review, not just the agent's.

---

## Phase 13 — Performance, SEO & accessibility pass

```
Read AGENTS.md.

Run a pass for: image optimization (next/image for product and hero images), meta tags and locale-aware SEO (hreflang tags for en/ar/fr), Lighthouse accessibility check and fixes (contrast, alt text, keyboard navigation for the cart and admin panel), and basic loading/empty states across the storefront and admin panel so nothing shows a blank screen while data loads.
```

**Before moving on:** run Lighthouse yourself on the homepage and a product page; check scores are reasonable before deployment.

---

## Phase 14 — Deployment

```
Read AGENTS.md and ARCHITECTURE.md.

Prepare the project for Vercel deployment: confirm the build succeeds locally (npm run build), document the exact environment variables that must be set in the Vercel dashboard (from .env.example), and add a DEPLOYMENT.md with step-by-step instructions including how to create and share the Google service account with the target Sheet (Editor access), and how to set up the file storage used for receipts in production.

Do not include any real secrets in the repo.
```

**Before moving on:** deploy to a Vercel preview environment, set the real env vars there, and run through the full customer + admin flow on the live preview URL before going to production.

---

## Phase 15 — UAT checklist & handoff

```
Read AGENTS.md, PROJECT_SPEC.md, and ARCHITECTURE.md.

Generate a UAT_CHECKLIST.md: a plain-language checklist (non-technical, for the client) covering every feature in PROJECT_SPEC.md as a testable step — e.g. "Log in as admin, add a new t-shirt with a price and quantity, confirm it appears on the storefront in all 3 languages." Also generate an ADMIN_GUIDE.md written for a non-developer store owner explaining how to manage products, confirm orders, edit homepage images, and edit translations.
```

**Before moving on:** walk through UAT_CHECKLIST.md yourself end to end before calling this done.
