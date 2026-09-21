import React from "react";
import { getProducts } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import AdminProductsClient from "./AdminProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return <AdminProductsClient products={products} categories={categories} locale={locale} />;
}
