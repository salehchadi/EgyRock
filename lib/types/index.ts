/**
 * Type definitions for EgyRock entities
 * These types correspond to the Google Sheets schema defined in ARCHITECTURE.md
 */

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
}

export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  name_fr: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  items_json: string;
  total: number;
  status: "Pending payment" | "Confirmed" | "Rejected";
  receipt_image_url: string;
  created_at: string;
  confirmed_at: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  name: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: "customer" | "admin";
  created_at: string;
}

export interface HomepageImage {
  id: string;
  image_url: string;
  link_url: string;
  title_en: string;
  title_ar: string;
  sort_order: number;
}

export interface Translation {
  key: string;
  en: string;
  ar: string;
  fr: string;
}

export interface Page {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  title_fr: string;
  content_en: string;
  content_ar: string;
  content_fr: string;
  is_published: boolean;
  updated_at: string;
}

export type Locale = "en" | "ar" | "fr";
