"use client";

import React from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCart } from "@/components/providers/CartProvider";
import { PosterBadge } from "@/components/ui/PosterBadge";
import { calculateStockStatus } from "@/lib/stock";

export default function CartPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const isFrench = locale === "fr";
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="bg-[#282521] border-2 border-[#3f3b35] p-10 sm:p-16 bg-screen-print">
          <div className="text-6xl mb-6">🛒</div>
          <h1
            className={`text-3xl sm:text-4xl uppercase text-[#f2ede4] mb-4 ${
              isArabic ? "font-arabic-heading font-bold" : "font-heading"
            }`}
          >
            {isArabic ? "السلة فارغة" : isFrench ? "Panier vide" : "YOUR CART IS EMPTY"}
          </h1>
          <p className="text-sm text-[#9e978e] mb-8">
            {isArabic
              ? "لم تضف أي منتجات بعد. تصفح الكتالوج وأضف ما يعجبك!"
              : isFrench
                ? "Vous n'avez rien ajouté. Parcourez le catalogue !"
                : "You haven't added any items yet. Browse the catalog and find something you like!"}
          </p>
          <Link
            href="/catalog"
            className="inline-block px-8 py-3 bg-[#e0562c] text-white font-heading uppercase tracking-wider text-sm border-2 border-black shadow-[4px_4px_0px_black] hover:bg-[#c44721] transition"
          >
            {isArabic ? "تصفح الكتالوج" : isFrench ? "Parcourir le catalogue" : "BROWSE CATALOG"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Cart Header */}
      <div className="bg-[#282521] border-2 border-[#3f3b35] p-6 bg-screen-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-block mb-2">
            <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#e0562c] bg-black/60 px-3 py-1 border border-[#e0562c]">
              {isArabic ? "سلة التسوق" : isFrench ? "Panier" : "SHOPPING CART"}
            </span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl uppercase text-[#f2ede4] ${
              isArabic ? "font-arabic-heading font-bold" : "font-heading"
            }`}
          >
            {isArabic
              ? `${totalItems} منتج في السلة`
              : isFrench
                ? `${totalItems} article${totalItems > 1 ? "s" : ""}`
                : `${totalItems} ITEM${totalItems > 1 ? "S" : ""} IN CART`}
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs uppercase font-heading tracking-wider text-[#dc2626] border border-[#dc2626] px-4 py-2 hover:bg-[#dc2626] hover:text-white transition cursor-pointer self-start"
        >
          {isArabic ? "تفريغ السلة" : isFrench ? "Vider le panier" : "CLEAR CART"}
        </button>
      </div>

      {/* Cart Items */}
      <div className="space-y-4">
        {items.map((item) => {
          const { product, quantity } = item;
          const stock = calculateStockStatus(product.quantity);

          const title = isArabic
            ? product.name_ar || product.name_en
            : isFrench
              ? product.name_fr || product.name_en
              : product.name_en;

          const imageSrc = product.images?.[0] || "/images/placeholders/egyrock-1.jpeg";

          const lineTotal = product.price * quantity;

          return (
            <div
              key={product.id}
              className="bg-[#282521] border-2 border-[#3f3b35] p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center group hover:border-[#e0562c]/50 transition"
            >
              {/* Product Image */}
              <Link
                href={`/catalog/${product.id}`}
                className="relative w-full sm:w-24 h-24 flex-shrink-0 overflow-hidden bg-[#141210] border border-[#3f3b35]"
              >
                <Image src={imageSrc} alt={title} fill className="object-cover" sizes="96px" />
              </Link>

              {/* Product Info */}
              <div className="flex-grow min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#e0562c] uppercase font-bold tracking-wider">
                      {product.category_id}
                    </span>
                    <Link href={`/catalog/${product.id}`}>
                      <h3
                        className={`text-base uppercase text-[#f2ede4] hover:text-[#e0562c] transition leading-snug ${
                          isArabic ? "font-arabic-heading font-bold" : "font-heading"
                        }`}
                      >
                        {title}
                      </h3>
                    </Link>
                  </div>
                  <PosterBadge
                    status={stock.status}
                    quantity={stock.quantity}
                    locale={locale}
                    size="sm"
                  />
                </div>

                {/* Price per unit */}
                <p className="text-xs text-[#9e978e] font-mono">
                  {product.price} {isArabic ? "ج.م" : "EGP"} {isArabic ? "/ الوحدة" : "/ unit"}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center border-2 border-[#3f3b35] bg-[#1c1a17]">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-sm text-[#f2ede4] hover:bg-[#332f2a] disabled:opacity-40 cursor-pointer font-bold"
                  >
                    −
                  </button>
                  <span className="px-4 py-1.5 text-sm font-mono font-bold text-[#f2ede4] border-x border-[#3f3b35]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    disabled={quantity >= product.quantity}
                    className="px-3 py-1.5 text-sm text-[#f2ede4] hover:bg-[#332f2a] disabled:opacity-40 cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right min-w-[80px]">
                  <span className="font-heading text-lg text-[#f2ede4]">{lineTotal}</span>
                  <span className="text-xs text-[#9e978e] font-mono ml-1">
                    {isArabic ? "ج.م" : "EGP"}
                  </span>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(product.id)}
                  className="p-2 text-[#9e978e] hover:text-[#dc2626] transition cursor-pointer"
                  aria-label="Remove item"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 4L12 12M4 12L12 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary & Actions */}
      <div className="bg-[#282521] border-2 border-[#e0562c] p-6 space-y-5">
        {/* Summary Lines */}
        <div className="space-y-2 border-b border-[#3f3b35] pb-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#9e978e] uppercase font-mono">
              {isArabic ? "عدد المنتجات" : isFrench ? "Articles" : "ITEMS"}
            </span>
            <span className="text-[#f2ede4] font-mono">{totalItems}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#9e978e] uppercase font-mono">
              {isArabic ? "الشحن" : isFrench ? "Livraison" : "SHIPPING"}
            </span>
            <span className="text-[#d97706] font-mono text-xs">
              {isArabic
                ? "يُحسب عند الدفع"
                : isFrench
                  ? "Calculé à la caisse"
                  : "CALCULATED AT CHECKOUT"}
            </span>
          </div>
        </div>

        {/* Grand Total */}
        <div className="flex items-center justify-between">
          <span
            className={`text-lg uppercase text-[#9e978e] ${
              isArabic ? "font-arabic-heading" : "font-heading"
            }`}
          >
            {isArabic ? "المجموع" : isFrench ? "Total" : "TOTAL"}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl text-[#f2ede4] ${
                isArabic ? "font-arabic-heading font-bold" : "font-heading"
              }`}
            >
              {totalPrice}
            </span>
            <span className="text-sm text-[#9e978e] font-mono">{isArabic ? "ج.م" : "EGP"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/catalog"
            className="flex-1 text-center py-3 px-6 border-2 border-[#3f3b35] text-[#f2ede4] font-heading uppercase tracking-wider text-sm hover:border-[#f2ede4] transition"
          >
            {isArabic ? "متابعة التسوق" : isFrench ? "Continuer les achats" : "CONTINUE SHOPPING"}
          </Link>
          <Link
            href="/checkout"
            className="flex-1 text-center py-3 px-6 bg-[#e0562c] text-white font-heading uppercase tracking-wider text-sm border-2 border-black shadow-[4px_4px_0px_black] hover:bg-[#c44721] transition"
          >
            {isArabic ? "إتمام الشراء" : isFrench ? "Passer la commande" : "PROCEED TO CHECKOUT"}
          </Link>
        </div>

        {/* Stock notice */}
        <p className="text-[11px] text-[#9e978e] text-center border-t border-[#3f3b35] pt-3">
          {isArabic
            ? "* ملاحظة: إضافة المنتجات إلى السلة لا تحجز الكمية. يتم تأكيد التوفر عند تأكيد الطلب من الإدارة."
            : isFrench
              ? "* Note : les articles dans le panier ne sont pas réservés. La disponibilité est confirmée lors de la validation par l'admin."
              : "* Note: Items in your cart are NOT reserved. Stock availability is confirmed upon admin order verification only."}
        </p>
      </div>
    </div>
  );
}
