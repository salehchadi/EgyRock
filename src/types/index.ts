export type Locale = "en" | "ar" | "fr";

export interface Product {
  id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  name_fr: string;
  desc_en: string;
  desc_ar: string;
  desc_fr: string;
  price: number;
  quantity: number;
  images: string[];
  created_at: string;
  /** Available sizes for wearables (e.g. ["S","M","L"]). Empty = one-size product. */
  sizes: string[];
}

export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  name_fr: string;
  /** Parent category id for nested sub-categories. Empty = top-level category. */
  parent_id: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  /** Selected size for wearable products (if any). */
  size?: string;
}

export type OrderStatus = "Pending payment" | "Confirmed" | "Rejected";

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  receipt_image_url: string;
  created_at: string;
  confirmed_at?: string;
  /** Coupon code applied at checkout (empty when no coupon). */
  coupon_code: string;
  /** Discount amount subtracted from the subtotal (0 when no coupon). */
  discount: number;
}

export type UserRole = "customer" | "admin";

export type Gender = "male" | "female" | "other";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: string;
  phone: string;
  /** Registered shipping address (used for "ship to registered address" at checkout). */
  address: string;
  gender: Gender | "";
  age: string;
}

export type CouponType = "percent" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  /** percent: 0-100, fixed: amount in EGP. */
  value: number;
  /** Minimum order subtotal required to use the coupon (0 = no minimum). */
  min_order: number;
  /** "true" | "false" — admin toggle. */
  active: boolean;
  /** Maximum number of uses across all customers (0 = unlimited). */
  usage_limit: number;
  used_count: number;
  /** ISO date after which the coupon expires ("" = never expires). */
  expires_at: string;
  created_at: string;
}

export interface HomepageImage {
  id: string;
  image_url: string;
  link_url?: string;
  title_en?: string;
  title_ar?: string;
  sort_order: number;
}

export interface TranslationRecord {
  key: string;
  en: string;
  ar: string;
  fr: string;
}

/* ================================================================
   PAGE BUILDER — section-based custom pages (Phase 10.1)
   Every localized string is stored per locale (EN/AR/FR) so the
   storefront renders the right language without extra lookups.
   ================================================================ */

export type PageLocale = "en" | "ar" | "fr";

export interface LocalizedText {
  en: string;
  ar: string;
  fr: string;
}

export type SectionType =
  "hero" | "heading" | "text" | "image" | "gallery" | "faq" | "products" | "cta" | "divider";

export type SectionAlign = "left" | "center";

export interface PageSectionBase {
  /** Stable client-generated key — never persisted as the page id. */
  id: string;
}

export interface HeroSection extends PageSectionBase {
  type: "hero";
  title: LocalizedText;
  subtitle: LocalizedText;
  image_url: string;
  button_label: LocalizedText;
  button_link: string;
  align: SectionAlign;
}

export interface HeadingSection extends PageSectionBase {
  type: "heading";
  text: LocalizedText;
  level: 2 | 3;
  align: SectionAlign;
}

export interface TextSection extends PageSectionBase {
  type: "text";
  /** Plain text — line breaks preserved (no markdown, no raw HTML). */
  body: LocalizedText;
  align: SectionAlign;
}

export interface ImageSection extends PageSectionBase {
  type: "image";
  image_url: string;
  alt: LocalizedText;
  caption: LocalizedText;
}

export interface GallerySection extends PageSectionBase {
  type: "gallery";
  images: string[];
  alt: LocalizedText;
  columns: 2 | 3 | 4;
}

export interface FaqItem {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
}

export interface FaqSection extends PageSectionBase {
  type: "faq";
  title: LocalizedText;
  items: FaqItem[];
}

export interface ProductsSection extends PageSectionBase {
  type: "products";
  title: LocalizedText;
  /** Empty string = all products. */
  category_id: string;
  /** Number of cards to show (1–24). */
  limit: number;
}

export interface CtaSection extends PageSectionBase {
  type: "cta";
  title: LocalizedText;
  body: LocalizedText;
  button_label: LocalizedText;
  button_link: string;
}

export interface DividerSection extends PageSectionBase {
  type: "divider";
  style: "line" | "stamp";
}

export type PageSection =
  | HeroSection
  | HeadingSection
  | TextSection
  | ImageSection
  | GallerySection
  | FaqSection
  | ProductsSection
  | CtaSection
  | DividerSection;

export type PageWidth = "narrow" | "wide" | "full";
export type PageBackground = "default" | "surface" | "sunken" | "brand-tint";

export interface PageSettings {
  width: PageWidth;
  background: PageBackground;
  /** Whether the page H1 header block is rendered above the sections. */
  show_title: boolean;
}

export interface CustomPage {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  title_fr: string;
  /** Legacy plain-text body — still rendered when `sections` is empty. */
  content_en: string;
  content_ar: string;
  content_fr: string;
  is_published: boolean;
  updated_at: string;
  /** Builder blocks (JSON cell). Empty array = legacy page layout. */
  sections: PageSection[];
  /** Page-level layout settings (JSON cell). */
  settings: PageSettings;
}
