import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Category } from "@/types";

interface CategoryGridProps {
  categories: Category[];
  locale: string;
}

const CATEGORY_IMAGES: Record<string, string> = {
  courses: "/images/placeholders/egyrock-1.jpeg",
  tshirts: "/images/placeholders/egyrock-2.jpeg",
  "t-shirts": "/images/placeholders/egyrock-2.jpeg",
  mugs: "/images/placeholders/egyrock-3.jpeg",
  accessories: "/images/placeholders/egyrock-5.jpeg",
};

export function CategoryGrid({ categories, locale }: CategoryGridProps) {
  const isArabic = locale === "ar";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#e0562c] pl-4 rtl:pl-0 rtl:pr-4 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#e0562c] block mb-1">
            Live Sheet Inventory
          </span>
          <h2
            className={`text-3xl sm:text-5xl font-extrabold uppercase text-[#f2ede4] tracking-tight ${
              isArabic ? "font-arabic-heading" : "font-heading"
            }`}
          >
            {isArabic
              ? "تسوق حسب القسم"
              : locale === "fr"
                ? "Acheter par Catégorie"
                : "SHOP BY CATEGORY"}
          </h2>
        </div>

        <p className="text-sm text-[#9e978e] max-w-md">
          {isArabic
            ? "جميع الأقسام والأسماء ديناميكية ويتم تحديثها مباشرة من لوحة التحكم وقاعدة البيانات"
            : "Dynamic categories synchronized directly from the database layer."}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, idx) => {
          const catName = isArabic
            ? cat.name_ar || cat.name_en
            : locale === "fr"
              ? cat.name_fr || cat.name_en
              : cat.name_en;
          const imageSrc =
            CATEGORY_IMAGES[cat.id.toLowerCase()] ||
            `/images/placeholders/egyrock-${(idx % 14) + 1}.jpeg`;

          return (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.id}`}
              className="underground-card p-4 flex flex-col justify-between group block select-none"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-[#141210] border border-[#3f3b35] mb-4">
                <Image
                  src={imageSrc}
                  alt={catName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 z-10">
                  <span className="text-[10px] font-mono uppercase bg-black/80 text-[#e0562c] px-2 py-0.5 border border-[#e0562c]">
                    CAT #0{idx + 1}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-grow flex flex-col justify-between">
                <div>
                  <h3
                    className={`text-xl sm:text-2xl uppercase text-[#f2ede4] group-hover:text-[#e0562c] transition ${
                      isArabic ? "font-arabic-heading font-bold" : "font-heading"
                    }`}
                  >
                    {catName}
                  </h3>
                  <p className="text-xs text-[#9e978e] mt-1">
                    {cat.id === "courses"
                      ? isArabic
                        ? "حقائب وكتب تعليمية ملموسة"
                        : "Shipped physical lessons & workbooks"
                      : isArabic
                        ? "منتجات أصلية وشحن سريع"
                        : "Heavyweight merch & fast shipping"}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#3f3b35] flex items-center justify-between mt-3">
                  <span className="text-xs font-heading uppercase tracking-wider text-[#e0562c]">
                    {isArabic ? "استكشف القسم" : "EXPLORE"}
                  </span>
                  <span className="text-[#e0562c] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
