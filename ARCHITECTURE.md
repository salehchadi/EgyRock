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

| Column Header | Data Type | Notes / Constraints                          |
| ------------- | --------- | -------------------------------------------- |
| `id`          | String    | Unique slug or UUID                          |
| `category_id` | String    | References `Categories.id`                   |
| `name_en`     | String    | English title                                |
| `name_ar`     | String    | Arabic title                                 |
| `name_fr`     | String    | French title                                 |
| `desc_en`     | String    | English description                          |
| `desc_ar`     | String    | Arabic description                           |
| `desc_fr`     | String    | French description                           |
| `price`       | Number    | Unit price in EGP                            |
| `quantity`    | Number    | Stock on hand; single source of truth        |
| `images`      | String    | Comma-delimited or JSON string array of URLs |
| `created_at`  | String    | ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`) |

#### Tab 2: `Categories`

| Column Header | Data Type | Notes / Constraints                               |
| ------------- | --------- | ------------------------------------------------- |
| `id`          | String    | Unique category slug (e.g. `courses`, `t-shirts`) |
| `name_en`     | String    | English label                                     |
| `name_ar`     | String    | Arabic label                                      |
| `name_fr`     | String    | French label                                      |

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

#### Tab 4: `Users`

| Column Header   | Data Type | Notes / Constraints                  |
| --------------- | --------- | ------------------------------------ |
| `id`            | String    | Unique user ID                       |
| `email`         | String    | Unique user email (case-insensitive) |
| `password_hash` | String    | Salted bcrypt hash                   |
| `name`          | String    | Full name                            |
| `role`          | String    | Enum: `customer` \| `admin`          |
| `created_at`    | String    | ISO 8601 string                      |

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

---

## 3. Data Access Layer (DAL) Pattern

All database reads and writes are encapsulated inside the `lib/data/` directory:

- `lib/data/sheetsClient.ts`: Authenticated Google Sheets client singleton with rate-limiting and retry wrappers.
- `lib/data/products.ts`: `getProducts()`, `getProductById(id)`, `createProduct(data)`, `updateProduct(id, data)`, `decrementProductStock(id, qty)`.
- `lib/data/categories.ts`: `getCategories()`, `createCategory(data)`, `updateCategory(id, data)`, `deleteCategory(id)`.
- `lib/data/orders.ts`: `getOrders()`, `getOrderById(id)`, `createOrder(data)`, `updateOrderStatus(id, status)`.
- `lib/data/users.ts`: `getUserByEmail(email)`, `createUser(data)`.
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
    │   │   ├── upload/route.ts   # Receipt upload handler
    │   │   └── admin/            # Protected admin API endpoints
    │   └── [locale]/
    │       ├── layout.tsx        # Locale root layout, sets dir="rtl" for ar
    │       ├── page.tsx          # Homepage with hero & category grid
    │       ├── style-guide/page.tsx # Design tokens & badge review
    │       ├── catalog/
    │       │   ├── page.tsx      # Filterable product catalog
    │       │   └── [id]/page.tsx # Product details with stock badge
    │       ├── cart/page.tsx     # Cart drawer / page
    │       ├── checkout/page.tsx # Manual InstaPay checkout & receipt upload
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
    │           ├── hero/page.tsx
    │           └── translations/page.tsx
    ├── components/
    │   ├── ui/
    │   │   ├── PosterBadge.tsx   # Poster-stamp stock badge
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   └── Card.tsx
    │   ├── layout/
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   └── LocaleSwitcher.tsx
    │   ├── home/
    │   │   ├── HeroCarousel.tsx
    │   │   └── CategoryGrid.tsx
    │   ├── catalog/
    │   │   ├── ProductCard.tsx
    │   │   └── StockStatus.tsx
    │   └── cart/
    │       └── CartDrawer.tsx
    ├── lib/
    │   ├── auth.ts               # NextAuth configuration
    │   ├── stock.ts              # Shared stock status calculation utility
    │   └── data/                 # Data Access Layer modules
    │       ├── sheetsClient.ts
    │       ├── products.ts
    │       ├── categories.ts
    │       ├── orders.ts
    │       ├── users.ts
    │       ├── homepageImages.ts
    │       ├── pages.ts
    │       └── translations.ts
    └── types/
        └── index.ts              # TypeScript interfaces for all entities
```

---

## 5. Design Tokens & Visual Tokens

### Palette Tokens

- `bg-surface-dark`: `#1c1a17` (Charcoal canvas base)
- `bg-surface-card`: `#282521` (Card surface)
- `text-primary`: `#f2ede4` (Off-white warm bone)
- `text-muted`: `#9e978e` (Ash gray)
- `accent-coral`: `#e0562c` (Cairo underground rock coral)
- `border-gritty`: `#3f3b35` (Screen-print raw border)

### Stock Badge Tokens

- `stock-in`: `#2ea043` (Vintage Terminal Green)
- `stock-countdown`: `#d97706` (Poster Amber)
- `stock-out`: `#dc2626` (Distressed Crimson)

### Typography Stack

- **Latin Display**: `font-anton` (`Anton`, sans-serif)
- **Latin Body/Mono/Labels**: `font-oswald` (`Oswald`, sans-serif)
- **Arabic Display & Body**: `font-cairo` (`Cairo`, sans-serif) / `font-almarai` (`Almarai`, sans-serif)

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
