# EgyRock — Section-Based Page Builder Plan (`PLAN-PAGE-BUILDER.md`)

> Status: **APPROVED — IN IMPLEMENTATION** (started 2026-10-06)
> Scope: Full section-based page builder for the admin panel. Explicitly **out of scope**: nav/header placement changes, markdown-only editing.

---

## 1. Background & Current State

| Area               | Status                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add/remove pages   | ✅ Exists — `/admin/pages` table + form (slug, EN/AR/FR titles, plain-text content, publish flag), role-guarded API `/api/admin/pages`, DAL `src/lib/data/pages.ts`, storefront route `/[locale]/pages/[slug]`, footer auto-links published pages |
| Page customization | ❌ Fixed layout only: title bar + one plain-text body. No structure, images, or per-section layout                                                                                                                                                |
| Storage            | Google Sheets `Pages` tab (10 columns, index-based row parsing); local dev store migrates headers via `reconcileHeaders()`; bundled `initialData.json` fallback                                                                                   |
| Tests              | 107 Vitest green, 23 Playwright specs; `signInAsAdmin` e2e helper available                                                                                                                                                                       |

## 2. Data Model

New types in `src/types/index.ts`:

```ts
type SectionType =
  "hero" | "heading" | "text" | "image" | "gallery" | "faq" | "products" | "cta" | "divider";

interface PageSection {
  id: string; // stable key (reorder/duplicate)
  type: SectionType;
  // per-type localized fields (EN/AR/FR) + per-type settings (image URLs, category, etc.)
}

interface PageSettings {
  width: "narrow" | "wide" | "full";
  background: "default" | "surface" | "sunken" | "brand-tint";
  show_title: boolean; // show/hide the page H1 block
}

interface CustomPage {
  // …existing fields kept; content_* retained as legacy fallback…
  sections: PageSection[]; // NEW — JSON in sheet column
  settings: PageSettings; // NEW — JSON in sheet column
}
```

### Sheet schema change

- Append 2 columns to `Pages` tab: `sections` (JSON), `settings` (JSON) in `TAB_HEADERS` (`src/lib/data/sheetsClient.ts`).
- Local store: `reconcileHeaders()` migrates automatically.
- Live store: `scripts/init-sheets.ts` extended to **append missing header columns** to an existing header row (currently it only writes headers when the tab is empty).
- Old 10-column rows keep parsing: DAL reads `row[10] ?? ""` with safe fallbacks (no data migration required).
- **Constraint:** Google Sheets caps cells at 50,000 chars. DAL rejects saves with serialized `sections` > ~48k with a clear admin error.

## 3. Implementation Steps

- **Step A — Types + DAL**: new types; `rowToPage`/`pageToRow` JSON round-trip with safe fallback (malformed → `[]`/defaults, never throw on read); shared server-side validation (type whitelist, required fields, size caps, slug rules); `createPage`/`updatePage` accept new fields.
- **Step B — Admin API**: `/api/admin/pages` routes pass through + validate `sections`/`settings` server-side; existing session/role checks untouched.
- **Step C — Admin builder UI** (`AdminPagesClient.tsx` + new components):
  - Page meta panel: slug, EN/AR/FR titles, publish toggle, settings row (width/background/show-title) using existing `admin-input`/`label-field`/`admin-btn-*` classes.
  - Section stack: "Add section" type picker → cards with **Move up / Move down / Duplicate / Delete** (native buttons, no drag-drop dep), expand/collapse editor, **EN/AR/FR tabs** per localized field.
  - Per-type editors: hero, heading, text, image, gallery (repeatable URL rows), faq (repeatable Q/A), products (category picker), cta, divider.
  - Inline preview: renders the storefront `PageRenderer` inside the editor before publish; drafts stay gated by `is_published`.
- **Step D — Storefront renderer**: `src/components/pages/PageRenderer.tsx` (server component) maps sections → Cairo Underground-styled blocks (Anton/Oswald + Cairo, charcoal/coral, poster-stamp borders, halftone), RTL-aware; `faq` via native `<details>`; `products` reuses `ProductCard` + DAL; `text` renders with preserved line breaks (no markdown lib). Route uses renderer when `sections.length > 0`, else legacy title+content path.
- **Step E — Spec docs**: this feature extends `PROJECT_SPEC.md` §8.3, so per `AGENTS.md` it was flagged in-plan; update `PROJECT_SPEC.md` §8, `ARCHITECTURE.md` §2 (Pages tab schema + DAL signature), and `STATE.md`.

## 4. Test Plan

| Suite                                                        | Coverage                                                                                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Unit `tests/unit/pageSections.test.ts`                       | JSON round-trip, malformed-JSON fallback, type whitelist rejection, size-cap rejection, reorder/duplicate helpers |
| Unit `tests/unit/pageRenderer.test.tsx`                      | Each section type renders content; AR → RTL; `show_title:false` hides header; empty sections → legacy path        |
| Integration (extend `tests/integration/data-access.test.ts`) | create/update with sections+settings round-trip via fake Sheets; legacy 10-column row parses; size cap enforced   |
| E2E `tests/e2e/page-builder.spec.ts`                         | Admin login → create page (hero+text+faq) → save → storefront shows sections → footer link appears → delete → 404 |
| Regression                                                   | `npm run test`, `npm run lint`, `npm run build` all green                                                         |

## 5. Deployment

1. Full test suite + lint + `npm run build`.
2. Conventional commit (`feat(admin): section-based page builder…`), push to `origin/master` (Husky + lint-staged).
3. Vercel deploys from push (per `DEPLOYMENT.md`); no secrets in repo.
4. Run `npm run db:init` once against the live sheet so the `Pages` header gains `sections`/`settings` (non-destructive append).

## 6. Assumptions & Limitations (flagged)

- **No new npm dependencies** (AGENTS.md): reorder = buttons, not drag-drop; rich text = plain text with line breaks, not markdown/HTML (also avoids XSS).
- Image fields take **URLs**, consistent with the existing Hero Images admin (no upload pipeline to reuse).
- 50k-cell cap on serialized `sections` (Sheets hard limit) with friendly save-time error.
- Header/drawer hardcoded links unchanged (out of scope by user decision).
- `how-to-pay`/`about` route-level fallback content stays; DB pages always win.
