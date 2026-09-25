import React from "react";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getProducts } from "@/lib/data/products";
import { PosterBadge } from "@/components/ui/PosterBadge";
import { calculateStockStatus } from "@/lib/stock";

export const revalidate = 0; // Ensure fresh live data on page refresh

/**
 * Mobile-first homepage: the FIRST (and only) section is the product strip,
 * scrollable left/right with touch swipe, arrow keys, or the scrollbar.
 * The previous hero / category / featured sections have been removed.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch live data strictly from Data Access Layer server-side
  const allProducts = await getProducts();

  const isArabic = locale === "ar";

  return (
    <div className="pb-10">
      <section aria-label="Products" className="w-full">
        {allProducts.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 py-16 text-center bg-surface border-2 border-line">
            <p className="text-lg font-heading uppercase text-ink">
              {isArabic ? "لا توجد منتجات بعد" : "NO PRODUCTS YET"}
            </p>
          </div>
        ) : (
          <div className="horizontal-scroll px-4 sm:px-6 lg:px-8 py-6">
            {allProducts.map((product) => {
              const stock = calculateStockStatus(product.quantity);
              const isOut = stock.status === "out_of_stock";
              const title = isArabic
                ? product.name_ar || product.name_en
                : locale === "fr"
                  ? product.name_fr || product.name_en
                  : product.name_en;

              const imageSrc = product.images?.[0] || "/images/placeholders/egyrock-1.jpeg";

              return (
                <Link
                  key={product.id}
                  href={`/catalog/${product.id}`}
                  className={`underground-card p-3 sm:p-4 flex flex-col w-[68vw] max-w-[300px] sm:w-[45vw] lg:w-[22rem] group transition-all block ${
                    isOut ? "opacity-60 grayscale-[30%]" : ""
                  }`}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-sunken border border-line mb-3 sm:mb-4">
                    <Image
                      src={imageSrc}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 68vw, (max-width: 1024px) 45vw, 22rem"
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

                  <span className="text-[11px] font-mono text-brand uppercase font-bold block mb-1">
                    {product.category_id}
                  </span>

                  <h2
                    className={`text-base sm:text-lg uppercase text-ink group-hover:text-brand transition leading-snug line-clamp-2 ${
                      isArabic ? "font-arabic-heading font-bold" : "font-heading"
                    }`}
                  >
                    {title}
                  </h2>

                  <div className="pt-3 border-t border-line mt-auto flex items-center justify-between gap-2">
                    <span className="font-heading text-lg sm:text-xl text-ink whitespace-nowrap">
                      {product.price} {isArabic ? "ج.م" : "EGP"}
                    </span>
                    <span
                      className={`text-xs font-heading uppercase tracking-wider px-3 py-1.5 border transition ${
                        isOut
                          ? "border-line text-muted"
                          : "border-brand text-brand group-hover:bg-brand group-hover:text-white"
                      }`}
                    >
                      {isOut ? (isArabic ? "نفد" : "SOLD OUT") : isArabic ? "تفاصيل" : "DETAILS"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
