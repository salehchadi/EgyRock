import React, { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getProducts } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";

export const revalidate = 0;

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);

  const [allProducts, categories] = await Promise.all([getProducts(), getCategories()]);

  const isArabic = locale === "ar";

  const filteredProducts = category
    ? allProducts.filter((p) => p.category_id.toLowerCase() === category.toLowerCase())
    : allProducts;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Catalog Header Banner */}
      <div className="bg-[#282521] border-2 border-[#3f3b35] p-6 sm:p-10 relative bg-screen-print shadow-[6px_6px_0px_#e0562c]">
        <div className="max-w-3xl space-y-3">
          <div className="inline-block">
            <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#e0562c] bg-black/60 px-3 py-1 border border-[#e0562c]">
              {isArabic ? "الكتالوج الرسمي" : "OFFICIAL STORE ARCHIVE"}
            </span>
          </div>
          <h1
            className={`text-4xl sm:text-6xl font-extrabold uppercase text-[#f2ede4] leading-tight ${
              isArabic ? "font-arabic-heading" : "font-heading"
            }`}
          >
            {isArabic ? "كتالوج منتجات إيجي روك" : "PHYSICAL MERCH & LESSON KITS"}
          </h1>
          <p className="text-sm sm:text-base text-[#c5beaf]">
            {isArabic
              ? "جميع المنتجات تشحن مادياً إلى عنوانك في أي مكان في مصر، بما في ذلك حقائب وكتب الدورات التدريبية الملموسة."
              : "Every product listed is physically packed and shipped to your address in Egypt, including all boxed guitar lesson kits."}
          </p>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="border-b border-[#3f3b35] pb-4">
        <Suspense
          fallback={<div className="h-10 bg-[#282521] animate-pulse border border-[#3f3b35]" />}
        >
          <CategoryFilter categories={categories} activeCategory={category} />
        </Suspense>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#9e978e] uppercase font-mono">
        <span>
          {isArabic
            ? `عدد المنتجات المعروضة: ${filteredProducts.length}`
            : `Displaying ${filteredProducts.length} Items`}
        </span>
        {category && <span className="text-[#e0562c] font-bold">Filter: {category}</span>}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="bg-[#282521] border-2 border-[#3f3b35] p-12 text-center space-y-4">
          <p className="text-lg font-heading uppercase text-[#f2ede4]">
            {isArabic ? "لا توجد منتجات في هذا القسم حالياً" : "NO ITEMS FOUND IN THIS CATEGORY"}
          </p>
          <p className="text-xs text-[#9e978e]">
            {isArabic
              ? "اختر قسماً آخر أو تصفح جميع المنتجات"
              : "Try selecting a different filter category above."}
          </p>
        </div>
      )}
    </div>
  );
}
