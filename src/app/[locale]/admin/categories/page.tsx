import React from "react";
import { getCategories } from "@/lib/data/categories";
import AdminCategoriesClient from "./AdminCategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const categories = await getCategories();

  return <AdminCategoriesClient categories={categories} locale={locale} />;
}
