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
        <div className="bg-surface border-2 border-line p-10 sm:p-16 bg-screen-print">
          <div className="text-6xl mb-6">🛒</div>
          <h1
            className={`text-3xl sm:text-4xl uppercase text-ink mb-4 ${
              isArabic ? "font-arabic-heading font-bold" : "font-heading"
            }`}
          >
            {isArabic ? "السلة فارغة" : isFrench ? "Panier vide" : "YOUR CART IS EMPTY"}
          </h1>
          <p className="text-sm text-muted mb-8">
            {isArabic
              ? "لم تضف أي منتجات بعد. تصفح الكتالوج وأضف ما يعجبك!"
              : isFrench
                ? "Vous n'avez rien ajouté. Parcourez le catalogue !"
                : "You haven't added any items yet. Browse the catalog and find something you like!"}
          </p>
          <Link
            href="/catalog"
            className="inline-block px-8 py-3 bg-brand text-white font-heading uppercase tracking-wider text-sm border-2 border-black shadow-[4px_4px_0px_black] hover:bg-brand-strong transition"
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
      <div className="bg-surface border-2 border-line p-6 bg-screen-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-block mb-2">
            <span className="text-xs uppercase font-bold tracking-[0.25em] text-brand bg-black/60 px-3 py-1 border border-brand">
              {isArabic ? "سلة التسوق" : isFrench ? "Panier" : "SHOPPING CART"}
            </span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl uppercase text-ink ${
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
          className="text-xs uppercase font-heading tracking-wider text-danger border border-danger px-4 py-2 hover:bg-danger hover:text-white transition cursor-pointer self-start"
        >
          {isArabic ? "تفريغ السلة" : isFrench ? "Vider le panier" : "CLEAR CART"}
        </button>
      </div>

      {/* Cart Items */}
      <div className="space-y-4">
        {items.map((item) => {
          const { product, quantity, size } = item;
          const stock = calculateStockStatus(product.quantity);

          const title = isArabic
            ? product.name_ar || product.name_en
            : isFrench
              ? product.name_fr || product.name_en
              : product.name_en;

          const imageSrc = product.images[0] || "/images/placeholders/egyrock-1.jpeg";

          const lineTotal = product.price * quantity;

          return (
            <div
              key={`${product.id}-${size || "one-size"}`}
              className="bg-surface border-2 border-line p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center group hover:border-brand/50 transition"
            >
              {/* Product Image */}
              <Link
                href={`/catalog/${product.id}`}
                className="relative w-full sm:w-24 h-24 flex-shrink-0 overflow-hidden bg-sunken border border-line"
              >
                <Image src={imageSrc} alt={title} fill className="object-cover" sizes="96px" />
              </Link>

              {/* Product Info */}
              <div className="flex-grow min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-brand uppercase font-bold tracking-wider">
                      {product.category_id}
                    </span>
                    <Link href={`/catalog/${product.id}`}>
                      <h3
                        className={`text-base uppercase text-ink hover:text-brand transition leading-snug ${
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

                {/* Price per unit (+ size when set) */}
                <p className="text-xs text-muted font-mono">
                  {product.price} {isArabic ? "ج.م" : "EGP"} {isArabic ? "/ الوحدة" : "/ unit"}
                  {size && (
                    <span className="ms-2 inline-block px-2 py-0.5 border border-line text-ink uppercase">
                      {isArabic ? "المقاس" : isFrench ? "Taille" : "Size"}: {size}
                    </span>
                  )}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center border-2 border-line bg-canvas">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1, size)}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-sm text-ink hover:bg-surface-2 disabled:opacity-40 cursor-pointer font-bold"
                  >
                    −
                  </button>
                  <span className="px-4 py-1.5 text-sm font-mono font-bold text-ink border-x border-line">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1, size)}
                    disabled={quantity >= product.quantity}
                    className="px-3 py-1.5 text-sm text-ink hover:bg-surface-2 disabled:opacity-40 cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right min-w-[80px]">
                  <span className="font-heading text-lg text-ink">{lineTotal}</span>
                  <span className="text-xs text-muted font-mono ml-1">
                    {isArabic ? "ج.م" : "EGP"}
                  </span>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(product.id, size)}
                  className="p-2 text-muted hover:text-danger transition cursor-pointer"
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
      <div className="bg-surface border-2 border-brand p-6 space-y-5">
        {/* Summary Lines */}
        <div className="space-y-2 border-b border-line pb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted uppercase font-mono">
              {isArabic ? "عدد المنتجات" : isFrench ? "Articles" : "ITEMS"}
            </span>
            <span className="text-ink font-mono">{totalItems}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted uppercase font-mono">
              {isArabic ? "الشحن" : isFrench ? "Livraison" : "SHIPPING"}
            </span>
            <span className="text-warning font-mono text-xs">
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
            className={`text-lg uppercase text-muted ${
              isArabic ? "font-arabic-heading" : "font-heading"
            }`}
          >
            {isArabic ? "المجموع" : isFrench ? "Total" : "TOTAL"}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl text-ink ${
                isArabic ? "font-arabic-heading font-bold" : "font-heading"
              }`}
            >
              {totalPrice}
            </span>
            <span className="text-sm text-muted font-mono">{isArabic ? "ج.م" : "EGP"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/catalog"
            className="flex-1 text-center py-3 px-6 border-2 border-line text-ink font-heading uppercase tracking-wider text-sm hover:border-ink transition"
          >
            {isArabic ? "متابعة التسوق" : isFrench ? "Continuer les achats" : "CONTINUE SHOPPING"}
          </Link>
          <Link
            href="/checkout"
            className="flex-1 text-center py-3 px-6 bg-brand text-white font-heading uppercase tracking-wider text-sm border-2 border-black shadow-[4px_4px_0px_black] hover:bg-brand-strong transition"
          >
            {isArabic ? "إتمام الشراء" : isFrench ? "Passer la commande" : "PROCEED TO CHECKOUT"}
          </Link>
        </div>

        {/* Stock notice */}
        <p className="text-[11px] text-muted text-center border-t border-line pt-3">
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
