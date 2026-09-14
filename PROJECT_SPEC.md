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
- `created_at`: ISO timestamp.

### Dynamic Admin Management

- All product fields are editable directly by an admin via the admin dashboard without requiring any code changes or redeployments.
- Category names are multilingual and editable by the admin.
- New categories can be created and existing categories can be deleted/modified dynamically from the interface.

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
2. **Details Form**: Customer provides name, phone number, shipping address, and city/governorate.
3. **InstaPay Instructions**:
   - Customer is presented with the store's InstaPay handle / mobile number (e.g., `egyrock@instapay` or mobile payment number) and the exact order total in EGP.
   - Clear instructions tell the customer to transfer the total amount via their InstaPay app.
4. **Receipt Upload**:
   - Customer uploads a screenshot of the completed InstaPay transaction receipt (image formats: PNG, JPG, WEBP).
5. **Order Creation**:
   - The order is created with initial status `Pending payment`.
   - The uploaded receipt image URL is attached to the order.
   - The customer is redirected to an Order Confirmation screen displaying their Order ID and receipt preview.
   - The order appears immediately in the customer's "Order History" section.
   - **Note**: Stock quantity remains unchanged at this point.
6. **Admin Verification & Stock Decrement**:
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
     - Can register for an account (name, email, password).
     - Can log in and log out.
     - Can view profile and order history (orders, status, tracking details).
     - Can place orders.
  2. `admin`:
     - Can access the protected `/admin` control center.
     - Full management of products, categories, stock, orders, hero images, and translations.
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
  - Dedicated display and body Arabic typography (e.g. Cairo / Almarai) to preserve brand weight and energy in Arabic.
- **Editable Translations**:
  - Every UI string (buttons, headers, validation messages, badges) is stored in the database / `Translations` sheet and is editable via the Admin UI without code updates.
  - Every product title and description has localized columns (`_en`, `_ar`, `_fr`).

---

## 7. Homepage Specifications

- **Hero Banner**:
  - Dynamic rotating hero section showing 3 slides/images.
  - Auto-advancing with manual previous/next controls and indicator dots.
  - Each slide features an editable image URL, optional link URL, headline, and sort order.
  - Fully manageable and reorderable via the Admin panel.
- **Shop by Category Section**:
  - Dynamically displays all active categories fetched directly from the database (not hardcoded).
  - Cards feature category titles in the active language and styled with underground rock aesthetic.
- **Featured Products Section**:
  - Highlights selected or newest products with stock status badges and quick view/cart actions.

---

## 8. Admin Panel Capabilities

All operations must be performed directly through the Admin UI with zero code changes or redeployments required:

1. **Products**: Add new products, edit details (multilingual titles, descriptions, price, quantity, images), assign categories, delete products.
2. **Categories**: Add, rename (EN/AR/FR), and delete categories.
3. **Inventory & Stock**: Adjust quantities directly, configure global or per-product `low_stock_threshold`.
4. **Orders**: View order queue with filter by status (`Pending payment`, `Confirmed`, `Rejected`), inspect receipt images in full resolution, Confirm (triggering stock decrement) or Reject orders.
5. **Hero Images**: Upload/link new banners, change links, and modify slide sequence.
6. **Translations**: Table-style management to look up and update any UI translation key across English, Arabic, and French.

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
