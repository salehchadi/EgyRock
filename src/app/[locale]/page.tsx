import React from "react";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getHomepageImages } from "@/lib/data/homepageImages";
import { getCategories } from "@/lib/data/categories";
import { getProducts } from "@/lib/data/products";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { PosterBadge } from "@/components/ui/PosterBadge";
import { calculateStockStatus } from "@/lib/stock";

export const revalidate = 0; // Ensure fresh live data on page refresh

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch live data strictly from Data Access Layer server-side
  const [slides, categories, allProducts] = await Promise.all([
    getHomepageImages(),
    getCategories(),
    getProducts(),
  ]);

  const isArabic = locale === "ar";
  const featured = allProducts.slice(0, 4);

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Dynamic Hero Section (3 Rotating Slides) */}
      <HeroCarousel slides={slides} locale={locale} />

      {/* 2. Shop By Category (Live categories from database) */}
      <CategoryGrid categories={categories} locale={locale} />

      {/* 3. Featured Physical Merch & Courses */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#e0562c] pl-4 rtl:pl-0 rtl:pr-4 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#e0562c] block mb-1">
                Authentic Physical Drops
              </span>
              <h2
                className={`text-3xl sm:text-5xl font-extrabold uppercase text-[#f2ede4] tracking-tight ${
                  isArabic ? "font-arabic-heading" : "font-heading"
                }`}
              >
                {isArabic ? "أحدث إصدارات الأندر جراوند" : "LATEST UNDERGROUND DROPS"}
              </h2>
            </div>

            <Link
              href="/catalog"
              className="text-xs font-heading uppercase tracking-wider text-[#e0562c] hover:underline"
            >
              {isArabic ? "عرض جميع المنتجات" : "VIEW FULL CATALOG"} &rarr;
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => {
              const stock = calculateStockStatus(product.quantity);
              const isOut = stock.status === "out_of_stock";
              const title = isArabic
                ? product.name_ar || product.name_en
                : locale === "fr"
                  ? product.name_fr || product.name_en
                  : product.name_en;

              const imageSrc = product.images?.[0] || "/images/placeholders/egyrock-1.jpeg";

              return (
                <div
                  key={product.id}
                  className={`underground-card p-4 flex flex-col justify-between group ${
                    isOut ? "opacity-60 grayscale-[30%]" : ""
                  }`}
                >
                  <div>
                    <div className="relative aspect-square w-full overflow-hidden bg-[#141210] border border-[#3f3b35] mb-4">
                      <Image
                        src={imageSrc}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 z-10">
                        <PosterBadge
                          status={stock.status}
                          quantity={stock.quantity}
                          locale={locale}
                          size="sm"
                        />
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-[#e0562c] uppercase font-bold block mb-1">
                      {product.category_id}
                    </span>

                    <h3
                      className={`text-lg uppercase text-[#f2ede4] group-hover:text-[#e0562c] transition leading-snug line-clamp-2 ${
                        isArabic ? "font-arabic-heading font-bold" : "font-heading"
                      }`}
                    >
                      {title}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-[#3f3b35] mt-4 flex items-center justify-between">
                    <span className="font-heading text-xl text-[#f2ede4]">
                      {product.price} {isArabic ? "ج.م" : "EGP"}
                    </span>
                    <Link
                      href={`/catalog/${product.id}`}
                      className={`text-xs font-heading uppercase tracking-wider px-3 py-1.5 border transition ${
                        isOut
                          ? "border-[#3f3b35] text-[#9e978e]"
                          : "border-[#e0562c] text-[#e0562c] hover:bg-[#e0562c] hover:text-white"
                      }`}
                    >
                      {isOut ? (isArabic ? "نفد" : "SOLD OUT") : isArabic ? "تفاصيل" : "DETAILS"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
