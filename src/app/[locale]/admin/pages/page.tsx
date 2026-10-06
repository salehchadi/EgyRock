import React from "react";
import { getPages } from "@/lib/data/pages";
import { getCategories } from "@/lib/data/categories";
import { getProducts } from "@/lib/data/products";
import AdminPagesClient from "./AdminPagesClient";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [pages, categories, products] = await Promise.all([
    getPages(),
    getCategories(),
    getProducts(),
  ]);

  return (
    <AdminPagesClient pages={pages} categories={categories} products={products} locale={locale} />
  );
}
