import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Product } from "@/types";
import { PosterBadge } from "@/components/ui/PosterBadge";
import { calculateStockStatus } from "@/lib/stock";

interface ProductCardProps {
  product: Product;
  locale: string;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const stock = calculateStockStatus(product.quantity);
  const isOut = stock.status === "out_of_stock";
  const isArabic = locale === "ar";

  const title = isArabic
    ? product.name_ar || product.name_en
    : locale === "fr"
      ? product.name_fr || product.name_en
      : product.name_en;

  const desc = isArabic
    ? product.desc_ar || product.desc_en
    : locale === "fr"
      ? product.desc_fr || product.desc_en
      : product.desc_en;

  const imageSrc = product.images[0] || "/images/placeholders/egyrock-1.jpeg";

  return (
    <div
      className={`underground-card p-4 flex flex-col justify-between group transition-all ${
        isOut ? "opacity-60 grayscale-[35%]" : ""
      }`}
    >
      <div>
        <Link
          href={`/catalog/${product.id}`}
          className="relative aspect-square w-full overflow-hidden bg-[#141210] border border-[#3f3b35] block mb-4"
        >
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
        </Link>

        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-[#e0562c] uppercase font-bold tracking-wider">
            {product.category_id}
          </span>

          <Link href={`/catalog/${product.id}`}>
            <h3
              className={`text-lg uppercase text-[#f2ede4] group-hover:text-[#e0562c] transition leading-snug line-clamp-2 ${
                isArabic ? "font-arabic-heading font-bold" : "font-heading"
              }`}
            >
              {title}
            </h3>
          </Link>

          <p className="text-xs text-[#9e978e] line-clamp-2 leading-relaxed">{desc}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-[#3f3b35] mt-4 flex items-center justify-between">
        <div>
          <span className="text-xs text-[#9e978e] block uppercase font-mono">
            {isArabic ? "السعر" : "PRICE"}
          </span>
          <span className="font-heading text-xl text-[#f2ede4]">
            {product.price} {isArabic ? "ج.م" : "EGP"}
          </span>
        </div>

        <Link
          href={`/catalog/${product.id}`}
          className={`text-xs font-heading uppercase tracking-wider px-3.5 py-2 border transition ${
            isOut
              ? "border-[#3f3b35] text-[#9e978e] pointer-events-none cursor-not-allowed"
              : "border-[#e0562c] text-[#e0562c] hover:bg-[#e0562c] hover:text-white cursor-pointer shadow-[2px_2px_0px_#e0562c]"
          }`}
        >
          {isOut ? (isArabic ? "نفد" : "SOLD OUT") : isArabic ? "عرض المنتج" : "VIEW ITEM"}
        </Link>
      </div>
    </div>
  );
}
