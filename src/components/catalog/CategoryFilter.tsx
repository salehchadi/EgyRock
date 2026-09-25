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

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const labelOf = (cat: Category) =>
    isArabic
      ? cat.name_ar || cat.name_en
      : locale === "fr"
        ? cat.name_fr || cat.name_en
        : cat.name_en;

  function handleFilter(catId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (catId) {
      params.set("category", catId);
    } else {
      params.delete("category");
    }
    router.push(`/${locale}/catalog?${params.toString()}`);
  }

  /** Renders a top-level category followed by its indented sub-categories. */
  const renderChip = (cat: Category, nested = false) => {
    const isActive = activeCategory?.toLowerCase() === cat.id.toLowerCase();

    return (
      <button
        key={cat.id}
        onClick={() => handleFilter(cat.id)}
        className={`px-4 py-2 text-xs uppercase font-bold tracking-wider transition border cursor-pointer ${
          nested ? "opacity-90" : ""
        } ${
          isActive
            ? "bg-brand text-white border-black shadow-[2px_2px_0px_black]"
            : "bg-surface text-muted border-line hover:border-ink hover:text-ink"
        } ${isArabic ? "font-arabic-heading" : "font-heading"}`}
      >
        {nested && <span className="me-1 opacity-70">↳</span>}
        {labelOf(cat)}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 pb-2">
      <button
        onClick={() => handleFilter(undefined)}
        className={`px-4 py-2 text-xs uppercase font-bold tracking-wider transition border cursor-pointer ${
          !activeCategory
            ? "bg-brand text-white border-black shadow-[2px_2px_0px_black]"
            : "bg-surface text-muted border-line hover:border-ink hover:text-ink"
        } ${isArabic ? "font-arabic-heading" : "font-heading"}`}
      >
        {isArabic ? "جميع المنتجات" : "ALL MERCH"}
      </button>

      {topLevel.map((cat) => (
        <React.Fragment key={cat.id}>
          {renderChip(cat)}
          {childrenOf(cat.id).map((sub) => renderChip(sub, true))}
        </React.Fragment>
      ))}
    </div>
  );
}
