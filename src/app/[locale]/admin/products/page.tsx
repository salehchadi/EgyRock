import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
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
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "admin") {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/admin/products`);
  }

  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return <AdminProductsClient products={products} categories={categories} locale={locale} />;
}
