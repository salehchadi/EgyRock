# EgyRock — Build State & Progress Log (`STATE.md`)

## Current Phase

- **Active Phase**: Phase 11 — Testing
- **Status**: COMPLETE (107 Vitest tests green; 23 Playwright E2E specs written)
- **Last Updated**: 2026-09-21

---

## Phase Execution Checklist

...

- [x] **Vercel Resiliency & Error #441 Fix**
  - [x] Bundled `initialData.json` into repository for instant out-of-the-box operation on Vercel
  - [x] Serverless-safe `/tmp` and in-memory persistence in `sheetsClient.ts` resolving `EROFS: read-only file system`
  - [x] Google Sheets API graceful fallback: logs connection errors and falls back to bundled data without throwing 500
  - [x] Fixed bracket syntax error in `scripts/seed.ts`
  - [x] Fixed `TypeError: Invalid URL` during build by providing fallback `NEXTAUTH_URL` in `next.config.ts`
- [x] **Phase 9 — Checkout & manual InstaPay flow**
  - [x] Checkout page with order summary, shipping details, InstaPay instructions, receipt upload
  - [x] Orders DAL with `Pending payment` initial status and `receipt_image_url`
  - [x] Order confirmation screen + customer order history
- [x] **Phase 10 — Admin panel**
  - [x] Protected `/admin` layout with sidebar nav (server-side role check via `getServerSession`)
  - [x] Dashboard with live DAL counts per module
  - [x] Products — add/edit/delete with multilingual fields, price, quantity, images, category assignment
  - [x] Categories — add/rename (EN/AR/FR)/delete
  - [x] Orders — status filter, receipt viewer, Confirm (stock decrement) / Reject with double-decrement guard
  - [x] Hero images — add/edit/delete/reorder slides
  - [x] Dynamic Pages — add/edit/delete custom pages with published flag
  - [x] Translations — searchable table editor across EN/AR/FR
  - [x] Admin API routes (all role-guarded server-side): products, categories, orders, hero, pages, translations
- [x] **Google Sheets Database Setup (live connection)**
  - [x] Service account key configured; sheet "Egy-rock" created manually in browser (service accounts on consumer projects cannot create files — Google-side quota limit)
  - [x] `scripts/setup-google.mjs` supports `--sheet-url` Mode A: attaches to an existing shared sheet, inits 7 tabs, seeds data, writes `.env.local`
  - [x] `scripts/detect-sheet.mjs` auto-detects spreadsheets shared with the service account via Drive API
  - [x] Sheet seeded: 4 categories, products, hero slides, translation keys, admin user (`admin@egyrock.com`)
  - [x] Verified live round-trips: `verify-homepage.ts` (hero images + category rename reflects from DB) and `verify-stock.ts` (all stock-status rules) pass
- [x] **Dynamic DB wiring — storefront-wide**
  - [x] `src/i18n/request.ts`: admin-editable Translations sheet overlaid on static JSON at runtime (30s cache, Node-runtime guard, safe fallback when DB unreachable)
  - [x] Storefront routes for admin-managed pages: `/[locale]/pages` (index) + `/[locale]/pages/[slug]` (rendered content, RTL-aware)
  - [x] Footer renders links to published DB pages dynamically
  - [x] All storefront data (hero, categories, products, stock, orders, users, translations, pages) flows through the `src/lib/data/*` DAL only
- [x] **Phase 11 — Testing**
  - [x] Toolchain: Vitest 3 + jsdom + Testing Library; Playwright + Chromium; `test`/`test:unit`/`test:integration`/`test:e2e`/`test:all` scripts
  - [x] Unit: `tests/unit/stock.test.ts` (13) — badge thresholds, boundaries, custom thresholds, availability flags
  - [x] Unit: `tests/unit/cart.test.tsx` (21) — totals, hydration, stock ceiling, removal, persistence, no-network stock rule
  - [x] Integration: `tests/integration/checkout-flow.test.ts` (17) — create→pending, confirm decrements once, reject untouched, validation errors
  - [x] Integration: `tests/integration/data-access.test.ts` (56) — products/categories/users/orders/hero/translations/pages CRUD against the fake Sheets client
  - [x] E2E: `tests/e2e/storefront.spec.ts` — browse en/ar/fr, RTL check, catalog→detail, cart add/merge/clear, no stock API calls on add
  - [x] E2E: `tests/e2e/checkout-admin.spec.ts` — guest checkout → Pending, admin confirm removes it from queue, non-admin blocked, dashboard pending count
  - [x] Result: `npm run test` = 107/107 green; `npx playwright test --list` = 23 specs valid; `npx eslint tests …` clean
- [ ] **Phase 12 — Security & validation hardening**
- [ ] **Phase 12 — Security & validation hardening**
- [ ] **Phase 13 — Performance, SEO & accessibility pass**
- [ ] **Phase 14 — Deployment**
- [ ] **Phase 15 — UAT checklist & handoff**
