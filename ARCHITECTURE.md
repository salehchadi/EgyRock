# EgyRock — Architecture & Technical Design (`ARCHITECTURE.md`)

This document outlines the architecture, database schema, data access layer (DAL), folder structure, and environment configuration for **EgyRock**.

---

## 1. Technology Stack

| Layer               | Selection                        | Description                                                         |
| ------------------- | -------------------------------- | ------------------------------------------------------------------- |
| **Framework**       | Next.js (App Router) 14+         | React framework with Server Components and Server Actions           |
| **Language**        | TypeScript                       | Strict type safety across UI, API, and Data Access Layers           |
| **Styling**         | Tailwind CSS + Vanilla CSS       | Custom design tokens and CSS halftone/screen-print utilities        |
| **Database**        | Google Sheets API (`googleapis`) | Cloud-hosted spreadsheet accessed strictly server-side              |
| **Authentication**  | NextAuth.js (v4 / v5)            | Credentials provider with bcrypt password hashing; role-based RBAC  |
| **i18n & RTL**      | `next-intl`                      | Locale-segmented routing (`/[locale]/...`), RTL attribute switching |
| **Receipt Storage** | Vercel Blob / Cloudinary         | Secure upload and hosting for InstaPay receipt screenshots          |
| **Deployment**      | Vercel                           | Production hosting optimized for Next.js App Router                 |

---

## 2. Data Layer & Google Sheets Schema

### Architectural Boundary: Server-Side Only

The frontend **never** interacts directly with Google Sheets. All operations occur on the server via dedicated Data Access Layer (DAL) modules using a Google Cloud Service Account with `https://www.googleapis.com/auth/spreadsheets` scope.

### Sheets / Tabs Specification

#### Tab 1: `Products`

| Column Header | Data Type | Notes / Constraints                                                                                         |
| ------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `id`          | String    | Unique slug or UUID                                                                                         |
| `category_id` | String    | References `Categories.id`                                                                                  |
| `name_en`     | String    | English title                                                                                               |
| `name_ar`     | String    | Arabic title                                                                                                |
| `name_fr`     | String    | French title                                                                                                |
| `desc_en`     | String    | English description                                                                                         |
| `desc_ar`     | String    | Arabic description                                                                                          |
| `desc_fr`     | String    | French description                                                                                          |
| `price`       | Number    | Unit price in EGP                                                                                           |
| `quantity`    | Number    | Stock on hand; single source of truth                                                                       |
| `images`      | String    | Comma-delimited or JSON string array of URLs                                                                |
| `created_at`  | String    | ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`)                                                                |
| `sizes`       | String    | Comma-delimited orderable sizes for wearables (e.g. `S,M,L,XL`). Empty = one-size product (no size picker). |

#### Tab 2: `Categories`

| Column Header | Data Type | Notes / Constraints                                                                       |
| ------------- | --------- | ----------------------------------------------------------------------------------------- |
| `id`          | String    | Unique category slug (e.g. `courses`, `t-shirts`)                                         |
| `name_en`     | String    | English label                                                                             |
| `name_ar`     | String    | Arabic label                                                                              |
| `name_fr`     | String    | French label                                                                              |
| `parent_id`   | String    | Empty = top-level category; otherwise the `id` of the parent category (one nesting level) |

#### Tab 3: `Orders`

| Column Header       | Data Type | Notes / Constraints                                             |
| ------------------- | --------- | --------------------------------------------------------------- |
| `id`                | String    | Unique order reference (e.g. `ORD-1001`)                        |
| `user_id`           | String    | References `Users.id` (or guest email)                          |
| `customer_name`     | String    | Recipient full name                                             |
| `customer_phone`    | String    | Egyptian phone number for shipping                              |
| `shipping_address`  | String    | Detailed physical delivery address                              |
| `items_json`        | String    | Serialized array `[{ product_id, quantity, unit_price, name }]` |
| `total`             | Number    | Total amount in EGP                                             |
| `status`            | String    | Enum: `Pending payment` \| `Confirmed` \| `Rejected`            |
| `receipt_image_url` | String    | URL of uploaded InstaPay transaction screenshot                 |
| `created_at`        | String    | ISO 8601 string                                                 |
| `confirmed_at`      | String    | ISO 8601 string or empty                                        |
| `coupon_code`       | String    | Coupon code applied at checkout (empty when none)               |
| `discount`          | Number    | Discount amount in EGP recomputed server-side from the coupon   |

#### Tab 4: `Users`

| Column Header   | Data Type | Notes / Constraints                                             |
| --------------- | --------- | --------------------------------------------------------------- |
| `id`            | String    | Unique user ID                                                  |
| `email`         | String    | Unique user email (case-insensitive)                            |
| `password_hash` | String    | Salted bcrypt hash                                              |
| `name`          | String    | Full name                                                       |
| `role`          | String    | Enum: `customer` \| `admin`                                     |
| `created_at`    | String    | ISO 8601 string                                                 |
| `phone`         | String    | Customer mobile number (collected at registration)              |
| `address`       | String    | Registered shipping address; can be reused at checkout          |
| `gender`        | String    | Enum: `male` \| `female` \| `` (unspecified)                    |
| `age`           | String    | Customer age as entered on the registration form (may be empty) |

#### Tab 5: `HomepageImages`

| Column Header | Data Type | Notes / Constraints                   |
| ------------- | --------- | ------------------------------------- |
| `id`          | String    | Unique slide ID                       |
| `image_url`   | String    | Hero banner image URL                 |
| `link_url`    | String    | Optional destination URL when clicked |
| `title_en`    | String    | Optional slide heading (EN)           |
| `title_ar`    | String    | Optional slide heading (AR)           |
| `sort_order`  | Number    | Order index (1, 2, 3)                 |

#### Tab 6: `Translations`

| Column Header | Data Type | Notes / Constraints                                |
| ------------- | --------- | -------------------------------------------------- |
| `key`         | String    | Unique translation key (e.g. `common.add_to_cart`) |
| `en`          | String    | English string                                     |
| `ar`          | String    | Arabic string                                      |
| `fr`          | String    | French string                                      |

#### Tab 7: `Pages`

| Column Header  | Data Type | Notes / Constraints                                 |
| -------------- | --------- | --------------------------------------------------- |
| `id`           | String    | Unique page ID                                      |
| `slug`         | String    | URL slug (e.g. `about`, `shipping`, `faq`, `terms`) |
| `title_en`     | String    | English title                                       |
| `title_ar`     | String    | Arabic title                                        |
| `title_fr`     | String    | French title                                        |
| `content_en`   | String    | English content / markdown                          |
| `content_ar`   | String    | Arabic content / markdown                           |
| `content_fr`   | String    | French content / markdown                           |
| `is_published` | Boolean   | `true` / `false`                                    |
| `updated_at`   | String    | ISO 8601 string                                     |

#### Tab 8: `Coupons`

| Column Header | Data Type | Notes / Constraints                                             |
| ------------- | --------- | --------------------------------------------------------------- |
| `id`          | String    | Unique coupon ID                                                |
| `code`        | String    | Unique uppercase customer-facing code (e.g. `ROCK10`)           |
| `type`        | String    | Enum: `percent` \| `fixed`                                      |
| `value`       | Number    | Percentage (when `percent`) or EGP amount (when `fixed`)        |
| `min_order`   | Number    | Minimum cart subtotal in EGP required to apply (0 = no minimum) |
| `active`      | Boolean   | `true` / `false`                                                |
| `usage_limit` | Number    | Maximum number of redemptions (0 = unlimited)                   |
| `used_count`  | Number    | Incremented once per successful checkout using the coupon       |
| `expires_at`  | String    | ISO 8601 expiry date, or empty for no expiry                    |
| `created_at`  | String    | ISO 8601 string                                                 |

---

## 3. Data Access Layer (DAL) Pattern

All database reads and writes are encapsulated inside the `lib/data/` directory:

- `lib/data/sheetsClient.ts`: Authenticated Google Sheets client singleton with rate-limiting and retry wrappers.
- `lib/data/products.ts`: `getProducts()`, `getProductById(id)`, `createProduct(data)`, `updateProduct(id, data)`, `decrementProductStock(id, qty)`.
- `lib/data/categories.ts`: `getCategories()`, `getCategoryById(id)`, `createCategory(data)`, `updateCategory(id, data)`, `deleteCategory(id)`.
- `lib/data/orders.ts`: `getOrders()`, `getOrderById(id)`, `getOrdersByUserId(userId)`, `createOrder(data)`, `updateOrderStatus(id, status)`.
- `lib/data/users.ts`: `getUsers()`, `getUserByEmail(email)`, `getUserById(id)`, `createUser(data)`, `updateUserRole(id, role)`.
- `lib/data/coupons.ts`: `getCoupons()`, `getCouponByCode(code)`, `createCoupon(data)`, `updateCoupon(id, updates)`, `deleteCoupon(id)`, `validateCoupon(code, subtotal)`, `incrementCouponUsage(id)`.
- `lib/data/homepageImages.ts`: `getHomepageImages()`, `updateHomepageImages(data)`.
- `lib/data/translations.ts`: `getTranslations(locale)`, `updateTranslation(key, values)`.
- `lib/data/pages.ts`: `getPages()`, `getPageBySlug(slug)`, `createPage(data)`, `updatePage(id, data)`, `deletePage(id)`.

> [!TIP]
> This pattern ensures that when EgyRock scales beyond Google Sheets to PostgreSQL or Supabase, zero changes are required in the UI or API routes; only the functions inside `lib/data/` will be updated.

---

## 4. Folder Structure Convention

```
egyrock/
├── .env.example
├── .env.local
├── AGENTS.md
├── ARCHITECTURE.md
├── CLAUDE.md
├── PLAYBOOK.md
├── PROJECT_SPEC.md
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── messages/                     # Static fallback translation JSONs
│   ├── en.json
│   ├── ar.json
│   └── fr.json
├── public/
│   ├── images/
│   └── icons/
├── scripts/
│   └── seed.ts                   # Seeds sample products, categories, hero slides
└── src/
    ├── middleware.ts             # Locale routing and admin route guarding
    ├── app/
    │   ├── api/
    │   │   ├── auth/[...nextauth]/route.ts
    │   │   ├── auth/register/route.ts  # Registration incl. phone, address, gender, age
    │   │   ├── checkout/route.ts       # Order creation + server-side coupon validation
    │   │   ├── coupons/validate/route.ts # Public coupon code validation
    │   │   └── admin/            # Protected admin API endpoints
    │   │       ├── products/, categories/, orders/
    │   │       ├── coupons/      # Coupon CRUD
    │   │       └── hero/, pages/, translations/
    │   └── [locale]/
    │       ├── layout.tsx        # Locale root layout, sets dir="rtl" for ar
    │       ├── page.tsx          # Mobile-first homepage: horizontal product strip only
    │       ├── style-guide/page.tsx # Design tokens & badge review
    │       ├── catalog/
    │       │   ├── page.tsx      # Filterable product catalog
    │       │   └── [id]/page.tsx # Product details, size picker & stock badge
    │       ├── cart/page.tsx     # Cart page
    │       ├── checkout/
    │       │   ├── page.tsx      # InstaPay checkout, coupon & receipt upload
    │       │   └── success/page.tsx
    │       ├── auth/
    │       │   ├── login/page.tsx
    │       │   └── register/page.tsx
    │       ├── account/page.tsx  # Customer profile & order history
    │       └── admin/            # Protected Admin Dashboard
    │           ├── layout.tsx
    │           ├── page.tsx      # Dashboard metrics & navigation
    │           ├── products/page.tsx
    │           ├── categories/page.tsx
    │           ├── orders/page.tsx
    │           ├── coupons/page.tsx
    │           ├── hero/page.tsx
    │           ├── pages/page.tsx
    │           └── translations/page.tsx
    ├── components/
    │   ├── ui/
    │   │   └── PosterBadge.tsx   # Poster-stamp stock badge
    │   ├── layout/
    │   │   ├── Header.tsx        # Mobile-first bar with hamburger + cart icon
    │   │   ├── MenuDrawer.tsx    # RTL-aware slide-in drawer with nested categories
    │   │   ├── Footer.tsx
    │   │   └── LocaleSwitcher.tsx
    │   ├── catalog/
    │   │   ├── ProductCard.tsx
    │   │   ├── ProductImageGallery.tsx
    │   │   ├── CategoryFilter.tsx
    │   │   └── AddToCartButton.tsx # Size selection + cart add
    │   ├── providers/
    │   │   ├── CartProvider.tsx
    │   │   └── AuthProvider.tsx
    │   ├── auth/
    │   │   └── SignOutButton.tsx
    │   └── ErrorBoundary.tsx
    ├── lib/
    │   ├── auth.ts               # NextAuth configuration
    │   ├── stock.ts              # Shared stock status calculation utility
    │   └── data/                 # Data Access Layer modules
    │       ├── sheetsClient.ts
    │       ├── products.ts
    │       ├── categories.ts
    │       ├── orders.ts
    │       ├── users.ts
    │       ├── coupons.ts
    │       ├── homepageImages.ts
    │       ├── pages.ts
    │       └── translations.ts
    └── types/
        └── index.ts              # TypeScript interfaces for all entities
```

---

## 5. Design Tokens & Visual Tokens

> **Single source of truth**: every token is declared once in the `@theme` block of `src/app/globals.css`.
> Tailwind v4 turns each `--color-*` token into utilities (`bg-*`, `text-*`, `border-*`).
> **To re-skin the storefront, edit only that block** — no component or page file hard-codes a hex value.

### Palette Tokens (utilities)

| Token                  | Utility example          | Default               | Role                            |
| ---------------------- | ------------------------ | --------------------- | ------------------------------- |
| `--color-canvas`       | `bg-canvas`              | `#1c1a17`             | Page background (charcoal base) |
| `--color-surface`      | `bg-surface`             | `#282521`             | Cards, header, drawer panels    |
| `--color-surface-2`    | `bg-surface-2`           | `#332f2a`             | Hover / elevated surface        |
| `--color-sunken`       | `bg-sunken`              | `#141210`             | Inset wells, image frames       |
| `--color-ink`          | `text-ink`               | `#f2ede4`             | Primary text (warm bone)        |
| `--color-ink-dim`      | `text-ink-dim`           | `#c5beaf`             | Secondary text                  |
| `--color-muted`        | `text-muted`             | `#9e978e`             | Labels, metadata                |
| `--color-line`         | `border-line`            | `#3f3b35`             | Borders & screen-print rules    |
| `--color-brand`        | `bg-brand text-brand`    | `#e0562c`             | Primary accent (buttons, links) |
| `--color-brand-strong` | `bg-brand-strong`        | `#c44721`             | Accent hover / active           |
| `--color-brand-soft`   | `bg-brand/10`-equivalent | `rgba(224,86,44,.25)` | Glow / tinted states            |
| `--color-brand-ghost`  | tinted selection fills   | `rgba(224,86,44,.05)` | Selected radio/option fills     |
| `--color-brand-ring`   | focus rings              | `rgba(224,86,44,.3)`  | Focus / border rings            |

### Status Tokens

| Token                  | Default               | Role                                |
| ---------------------- | --------------------- | ----------------------------------- |
| `--color-success`      | `#2ea043`             | In stock, confirmed orders          |
| `--color-warning`      | `#d97706`             | Low-stock countdown, pending orders |
| `--color-danger`       | `#dc2626`             | Out of stock, rejected orders       |
| `--color-success-soft` | `rgba(46,160,67,.12)` | Success badge background            |
| `--color-warning-soft` | `rgba(217,119,6,.14)` | Warning badge background            |
| `--color-danger-soft`  | `rgba(220,38,38,.15)` | Danger badge background             |

### Typography Stack

- **Latin Display**: `font-heading` → `Anton`
- **Latin Body/Mono/Labels**: `font-body` → `Oswald`
- **Arabic Display & Body**: `font-arabic-heading` → `Cairo` / `font-arabic-body` → `Almarai`

### Layout Utilities

- `.horizontal-scroll` — mobile-first single-row product strip (touch swipe, snap, hidden scrollbar)
- `.slide-in-left` / `.slide-in-right` — menu-drawer animation; the drawer opens from the **left** in LTR locales and the **right** in RTL (`ar`)
- `.underground-card`, `.poster-stamp-border`, `.halftone-texture` — Cairo-underground card & texture treatments

---

## 6. Environment Variables (`.env.example`)

```env
# Google Sheets Data Layer
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project-id.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6...==\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="your_google_sheet_spreadsheet_id"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_jwt_secret_generate_with_openssl_rand_base64_32"

# File Uploads (Receipts)
BLOB_READ_WRITE_TOKEN="vercel_blob_token_or_equivalent"

# Store Settings
NEXT_PUBLIC_INSTAPAY_HANDLE="egyrock@instapay"
NEXT_PUBLIC_DEFAULT_LOW_STOCK_THRESHOLD="5"
```
