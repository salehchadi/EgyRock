# EgyRock — Project Specification (`PROJECT_SPEC.md`)

This document is the single source of truth for the functional, domain, and design requirements of **EgyRock**. All development sessions, agents, and contributors must adhere strictly to these specifications.

---

## 1. Project Overview & Scope

- **Brand Name**: EgyRock
- **Description**: An ecommerce platform for alternative, rock-music, and underground streetwear lifestyle products and physical learning merchandise based in Egypt.
- **Product Types**: Physical products only. All products are physically shipped to the customer's address, including courses (e.g., boxed kits, physical workbooks, instructional USBs/media boxes).
- **Initial Product Categories**:
  1. `Courses` (physical course kits/materials)
  2. `T-shirts`
  3. `Mugs`
  4. `Accessories`

---

## 2. Product & Catalog Specifications

### Product Fields

Every product record consists of:

- `id`: Unique identifier (string / UUID / slug).
- `category_id`: Foreign key linking to an active Category.
- `name_en`, `name_ar`, `name_fr`: Localized product title in English, Arabic, and French.
- `desc_en`, `desc_ar`, `desc_fr`: Localized detailed description.
- `price`: Price in Egyptian Pounds (EGP).
- `quantity`: Integer representing current stock on hand.
- `images`: Comma-separated or JSON array of image URLs.
- `sizes`: Optional list of orderable sizes for wearables (e.g. `S, M, L, XL`). Empty/omitted means the product is **one-size** (mugs, picks, accessories) and no size picker is rendered; the product detail page and cart then omit the size field entirely.
- `created_at`: ISO timestamp.

### Dynamic Admin Management

- All product fields are editable directly by an admin via the admin dashboard without requiring any code changes or redeployments.
- `sizes` are edited as a comma-separated list in the admin product form and shown per product in the products table. Products that list sizes require the customer to choose one before adding to the cart; the chosen size is carried through the cart, the order summary and the order record.
- Category names are multilingual and editable by the admin.
- New categories can be created and existing categories can be deleted/modified dynamically from the interface.
- Categories are **one-level nestable** via `parent_id`: an empty `parent_id` marks a top-level category, any other value points at its parent. Sub-categories are assignable to products and are rendered nested (expand/collapse) inside the storefront menu drawer.

---

## 3. Stock Management & Inventory Logic

### Single Source of Truth

The `quantity` column is the single source of truth for inventory.

### Stock Display Rules

- **Out of Stock**: If `quantity === 0`:
  - Visual status: Red poster-stamp badge ("Out of stock" / "نفدت الكمية" / "Rupture de stock").
  - Card appearance: Dimmed / reduced opacity.
  - "Add to cart" button: Disabled.
- **Low Stock Countdown**: If `quantity > 0` and `quantity <= low_stock_threshold` (an admin-configurable threshold, defaulting to 5):
  - Visual status: Amber poster-stamp badge ("Only X left" / "متبقي X فقط" / "Plus que X restants").
  - "Add to cart" button: Enabled (up to available quantity).
- **In Stock**: If `quantity > low_stock_threshold`:
  - Visual status: Green poster-stamp badge ("In stock" / "متوفر" / "En stock").
  - "Add to cart" button: Enabled.

### Cart & Decrement Rule

- **Adding an item to the cart does NOT decrement stock in Google Sheets.**
- Stock is decremented **only** when an admin explicitly confirms an order and verifies the payment receipt in the admin panel.
- The cart validates that a user cannot add or request more items than the currently available quantity.

---

## 4. Checkout Flow (Manual InstaPay)

1. **Cart**: Customer reviews cart items and proceeds to checkout.
2. **Details Form**: Customer provides name and phone number.
3. **Shipping Address**: The customer chooses where the order ships:
   - **Registered address** — ship to the address saved on their profile (pre-selected when present).
   - **A different address** — a detailed address plus city/governorate typed at checkout.
4. **Coupon Code (optional)**: the customer can enter a coupon code in the order summary and apply it.
   - Validation is **server-side only** (`validateCoupon`): the code must exist, be active, not be expired, not have exhausted its usage limit, and the cart subtotal must satisfy the coupon's `min_order`.
   - The discount is always recomputed from the stored coupon record; a client-supplied amount is never trusted.
   - The summary shows Subtotal, Discount and the resulting Total, and the coupon can be removed before submitting.
5. **InstaPay Instructions**:
   - Customer is presented with the store's InstaPay handle / mobile number (e.g., `egyrock@instapay` or mobile payment number) and the exact order total in EGP, **after** the coupon discount.
   - Clear instructions tell the customer to transfer the total amount via their InstaPay app.
6. **Receipt Upload**:
   - Customer uploads a screenshot of the completed InstaPay transaction receipt (image formats: PNG, JPG, WEBP).
7. **Order Creation**:
   - The order is created with initial status `Pending payment`.
   - The uploaded receipt image URL is attached to the order.
   - The applied `coupon_code` and the computed `discount` are stored on the order, and the coupon's `used_count` is incremented exactly once.
   - The customer is redirected to an Order Confirmation screen displaying their Order ID and receipt preview.
   - The order appears immediately in the customer's "Order History" section.
   - **Note**: Stock quantity remains unchanged at this point.
8. **Admin Verification & Stock Decrement**:
   - Admin views the order list in the admin panel.
   - Admin inspects the customer's uploaded receipt image and compares with InstaPay account transactions.
   - If valid, admin clicks **"Confirm Order"**:
     - Order status transitions from `Pending payment` to `Confirmed`.
     - System automatically and atomically decrements the stock quantity for each product in the order by the purchased quantity.
     - Timestamp `confirmed_at` is recorded.
   - If invalid/rejected, admin clicks **"Reject Order"**:
     - Order status transitions to `Rejected`.
     - Stock is untouched.

---

## 5. User Roles & Authentication

- **Authentication System**: NextAuth.js credentials-based authentication with bcrypt password hashing.
- **Roles**:
  1. `customer`:
     - Can register for an account with: full name, email, password, **phone number, address, gender and age**.
     - Can log in and log out.
     - Can view profile and order history (orders, status, tracking details).
     - Can place orders.
  2. `admin`:
     - Can access the protected `/admin` control center.
     - Full management of products, categories, stock, coupons, orders, hero images, pages, and translations.
- **Route Protection**:
  - `/admin/*` routes are protected server-side and middleware-level. Any non-admin or unauthenticated visitor is redirected.

---

## 6. Internationalization (i18n) & RTL

- **Supported Locales**:
  - `en` — English (Default LTR)
  - `ar` — Arabic (RTL)
  - `fr` — French (LTR)
- **RTL Integrity for Arabic**:
  - Sets `dir="rtl"` on `<html>`.
  - True mirrored layout: navigation bars, cards, grid directions, form controls, icons, and drawer trays must mirror appropriately.
  - **Navigation Drawer**: the mobile menu is a slide-in drawer that opens from the **left** edge in LTR locales (`en`, `fr`) and from the **right** edge in RTL (`ar`), with mirrored animation.
  - Dedicated display and body Arabic typography (e.g. Cairo / Almarai) to preserve brand weight and energy in Arabic.
- **Editable Translations**:
  - Every UI string (buttons, headers, validation messages, badges) is stored in the database / `Translations` sheet and is editable via the Admin UI without code updates.
  - Every product title and description has localized columns (`_en`, `_ar`, `_fr`).

---

## 7. Homepage Specifications

- **Mobile-first**: the storefront is designed phone-first and scales up. Layout, tap targets and typography are tuned for a small screen before desktop.
- **The products strip is the first — and only — section of the homepage**:
  - There is **no** hero banner, **no** "shop by category" tile grid and **no** separate featured section on the homepage.
  - The page opens directly on the product list, fetched live through the DAL (no hardcoded products).
  - The strip scrolls horizontally: swipe on touch devices, scrollbar / trackpad / keyboard on desktop. It is a single row of cards — never a multi-row page-level grid.
  - Each card shows the product image, poster-stamp stock badge, category, localized title, price and links to the product detail page.
- **Categories live in the menu drawer**: category and sub-category navigation is provided by the drawer (§6) rather than by homepage tiles.
- **Hero images**: admin-managed hero slides are still stored in the `HomepageImages` tab and remain editable from the admin panel, but they are intentionally **not rendered on the homepage**.

---

## 8. Admin Panel Capabilities

All operations must be performed directly through the Admin UI with zero code changes or redeployments required:

1. **Products**: Add new products, edit details (multilingual titles, descriptions, price, quantity, images), assign categories, delete products.
2. **Categories**: Add, rename (EN/AR/FR), and delete categories.
3. **Pages**: Add, edit, and delete dynamic content pages (e.g. About Us, FAQ, Policies, Terms) with multilingual title and content directly from the frontend admin panel.
4. **Inventory & Stock**: Adjust quantities directly, configure global or per-product `low_stock_threshold`.
5. **Orders**: View order queue with filter by status (`Pending payment`, `Confirmed`, `Rejected`), inspect receipt images in full resolution, Confirm (triggering stock decrement) or Reject orders.
6. **Hero Images**: Upload/link new banners, change links, and modify slide sequence.
7. **Translations**: Table-style management to look up and update any UI translation key across English, Arabic, and French.

---

## 9. Visual Identity & Design Direction: "Cairo Underground"

- **Concept**: A fusion of authentic Egyptian rock-band posters, indie concert flyers, and underground streetwear aesthetics. Avoids generic tech-startup or minimalist SaaS templates.
- **Color Palette**:
  - Base Background: Dark Charcoal (`#1c1a17`)
  - Primary Text: Off-white Warm Bone (`#f2ede4`)
  - Accent / Brand: Warm Coral / Burnished Orange (`#e0562c`)
  - Secondary Dark / Surface: Deep Asphalt (`#282521`)
  - Border / Gritty Rules: Weathered Ash (`#3f3b35`)
- **Stock Badge Stamp Colors**:
  - In Stock: Vintage Terminal Green (`#2ea043`) outline + text
  - Countdown ("Only X left"): Poster Amber (`#d97706`) outline + text
  - Out of Stock: Distressed Crimson (`#dc2626`) outline + text
- **Typography**:
  - **Headings / Display (Latin)**: `Anton` (condensed bold poster headline).
  - **Body / Labels / Specs (Latin)**: `Oswald` (structured, utilitarian sans-serif).
  - **Arabic Headings & Body**: `Cairo` (heavy bold display weights) and `Almarai` to ensure the same gritty poster punch in RTL.
- **Stylistic Elements**:
  - Subtle diagonal halftone/screen-print texture background utility (pure CSS, lightweight).
  - Poster-stamp badges (stamped outline, condensed uppercase typography, raw borders).
  - High-contrast card surfaces with sharp or subtle corners, thick raw border lines, and punchy typography.
  - Strictly **no** generic pastel gradients, no soft blurry SaaS cards, and no cookie-cutter templates.
