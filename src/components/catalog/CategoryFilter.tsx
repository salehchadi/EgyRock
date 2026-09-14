"use client";

import React from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Category } from "@/types";

interface CategoryFilterProps {
  categories: Category[];
  activeCategory?: string;
}

export function CategoryFilter({ categories, activeCategory }: CategoryFilterProps) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArabic = locale === "ar";

  function handleFilter(catId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (catId) {
      params.set("category", catId);
    } else {
      params.delete("category");
    }
    router.push(`/${locale}/catalog?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 pb-2">
      <button
        onClick={() => handleFilter(undefined)}
        className={`px-4 py-2 text-xs uppercase font-bold tracking-wider transition border cursor-pointer ${
          !activeCategory
            ? "bg-[#e0562c] text-white border-black shadow-[2px_2px_0px_black]"
            : "bg-[#282521] text-[#9e978e] border-[#3f3b35] hover:border-[#f2ede4] hover:text-[#f2ede4]"
        } ${isArabic ? "font-arabic-heading" : "font-heading"}`}
      >
        {isArabic ? "جميع المنتجات" : "ALL MERCH"}
      </button>

      {categories.map((cat) => {
        const isActive = activeCategory?.toLowerCase() === cat.id.toLowerCase();
        const label = isArabic
          ? cat.name_ar || cat.name_en
          : locale === "fr"
            ? cat.name_fr || cat.name_en
            : cat.name_en;

        return (
          <button
            key={cat.id}
            onClick={() => handleFilter(cat.id)}
            className={`px-4 py-2 text-xs uppercase font-bold tracking-wider transition border cursor-pointer ${
              isActive
                ? "bg-[#e0562c] text-white border-black shadow-[2px_2px_0px_black]"
                : "bg-[#282521] text-[#9e978e] border-[#3f3b35] hover:border-[#f2ede4] hover:text-[#f2ede4]"
            } ${isArabic ? "font-arabic-heading" : "font-heading"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
