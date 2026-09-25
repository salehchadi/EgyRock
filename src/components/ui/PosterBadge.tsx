import React from "react";

export type StockStatusType = "in_stock" | "countdown" | "out_of_stock";

interface PosterBadgeProps {
  status: StockStatusType;
  quantity?: number;
  locale?: string;
  customText?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PosterBadge({
  status,
  quantity,
  locale = "en",
  customText,
  className = "",
  size = "md",
}: PosterBadgeProps) {
  const isArabic = locale === "ar";

  let label = customText;
  if (!label) {
    if (status === "in_stock") {
      label = isArabic ? "متوفر بالمخزن" : locale === "fr" ? "En stock" : "IN STOCK";
    } else if (status === "countdown") {
      const count = quantity ?? 1;
      label = isArabic
        ? `متبقي ${count} فقط`
        : locale === "fr"
          ? `Plus que ${count} restants`
          : `ONLY ${count} LEFT`;
    } else {
      label = isArabic ? "نفدت الكمية" : locale === "fr" ? "Rupture de stock" : "OUT OF STOCK";
    }
  }

  const colorStyles = {
    in_stock: "border-success text-success bg-success/10 shadow-[2px_2px_0px_var(--color-success)]",
    countdown:
      "border-warning text-warning bg-warning/10 shadow-[2px_2px_0px_var(--color-warning)]",
    out_of_stock: "border-danger text-danger bg-danger/10 shadow-[2px_2px_0px_var(--color-danger)]",
  }[status];

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 tracking-wider",
    md: "text-xs md:text-sm px-3 py-1 tracking-widest",
    lg: "text-sm md:text-base px-4 py-1.5 tracking-widest",
  }[size];

  return (
    <span
      className={`inline-flex items-center uppercase font-bold border-2 transition-all select-none ${
        isArabic ? "font-arabic-heading" : "font-heading"
      } ${colorStyles} ${sizeStyles} ${className}`}
      style={{
        transform: "rotate(-1deg)",
      }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 rtl:mr-0 rtl:ml-1.5 bg-current animate-pulse" />
      {label}
    </span>
  );
}
