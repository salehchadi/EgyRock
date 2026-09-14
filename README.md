# EgyRock 🎸🇪🇬

> Underground rock-music poster & streetwear ecommerce platform for physical merchandise, apparel, and learning kits in Egypt.

## Project Overview

EgyRock is built with Next.js (App Router), TypeScript, and Tailwind CSS. It uses Google Sheets as a lightweight server-side database via a dedicated Data Access Layer (DAL), NextAuth.js for customer and admin authentication, `next-intl` for English/Arabic(RTL)/French internationalization, and manual InstaPay payment verification.

---

## Quickstart & Setup

### 1. Prerequisites

- **Node.js**: v20+ LTS recommended (`node -v`)
- **npm**: v10+ (`npm -v`)

### 2. Install Dependencies

```bash
npm install
```

This will also automatically configure Husky pre-commit hooks via the `prepare` script.

### 3. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the required configuration:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account email with Editor access to the spreadsheet.
- `GOOGLE_PRIVATE_KEY`: Service account RSA private key formatted with escaped newlines (`\n`).
- `GOOGLE_SHEET_ID`: Spreadsheet ID from your Google Sheets URL.
- `NEXTAUTH_SECRET`: Secret key for JWT session encryption (generate with `openssl rand -base64 32`).
- `NEXTAUTH_URL`: Canonical site URL (e.g. `http://localhost:3000` for local dev).
- `BLOB_READ_WRITE_TOKEN`: Storage token for InstaPay receipt uploads.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Starts the Next.js development server            |
| `npm run build`        | Builds the production bundle                     |
| `npm run start`        | Runs the built production server                 |
| `npm run lint`         | Runs ESLint to check for code issues             |
| `npm run format`       | Runs Prettier across all files to format code    |
| `npm run format:check` | Verifies code formatting without writing changes |

---

## Documentation & Architecture

- [PROJECT_SPEC.md](PROJECT_SPEC.md) — Comprehensive functional specifications and business rules.
- [ARCHITECTURE.md](ARCHITECTURE.md) — Technical stack, Google Sheets schema, and DAL patterns.
- [AGENTS.md](AGENTS.md) — Guidelines and invariants for AI agents.
- [PLAYBOOK.md](PLAYBOOK.md) — Phase-by-phase development playbook.
- [STATE.md](STATE.md) — Active build status and phase checklist.
