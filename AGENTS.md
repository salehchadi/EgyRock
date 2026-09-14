# Agent Instructions — EgyRock

Before doing any work in this repo, read `PROJECT_SPEC.md` and `ARCHITECTURE.md` in full. Follow the conventions and data access layer pattern described there. Do not invent new product fields, statuses, or admin capabilities not listed in `PROJECT_SPEC.md` without flagging it first.

## Core Rules for All Agent Sessions:

1. **Source of Truth**: `PROJECT_SPEC.md` for product and business logic, `ARCHITECTURE.md` for technical stack and design tokens, and `PLAYBOOK.md` for phase sequence.
2. **Data Access Layer (DAL)**: All database reads/writes must go strictly through `lib/data/` modules server-side. Never call Google Sheets APIs directly from client components or arbitrary route files.
3. **Stock Decrement Rule**: Stock quantity in Google Sheets is decremented **only** when an admin confirms a payment receipt in the admin panel. Never decrement stock upon "add to cart" or checkout submission.
4. **Visual Direction**: Uphold the "Cairo Underground" rock-music poster & streetwear aesthetic (Anton/Oswald + Cairo fonts, charcoal `#1c1a17` base, coral `#e0562c` accent, poster-stamp status badges, and diagonal screen-print texture). Do not replace this with generic white SaaS cards or soft gradients.
5. **Phase-by-Phase**: Follow the playbook phases systematically without skipping verification criteria.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
