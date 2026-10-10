"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Product } from "@/types";
import { calculateStockStatus } from "@/lib/stock";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const stock = calculateStockStatus(product.quantity);
  const isOut = stock.status === "out_of_stock";

  const sizes = product.sizes || [];
  const hasSizes = sizes.length > 0;
  const colors = product.colors || [];
  const hasColors = colors.length > 0;

  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [added, setAdded] = useState(false);

  // Size and color must be picked before wearable can be added
  const sizeMissing = hasSizes && !size;
  const colorMissing = hasColors && !color;

  function handleAddToCart() {
    if (isOut || sizeMissing || colorMissing) return;

    try {
      const existingCart = JSON.parse(localStorage.getItem("egyrock_cart") || "[]");
      const selectedSize = hasSizes ? size : "";
      const selectedColor = hasColors ? color : "";

      // Stock is shared across sizes and colors: sum every line for this product.
      const alreadyInCart = existingCart
        .filter((item: any) => item.product.id === product.id)
        .reduce((sum: number, item: any) => sum + item.quantity, 0);

      if (alreadyInCart + quantity > product.quantity) {
        alert(
          isArabic
            ? `عفواً، الكمية المتاحة في المخزن هي ${product.quantity} فقط`
            : `Cannot add more than available stock (${product.quantity} available)`,
        );
        return;
      }

      const existingIndex = existingCart.findIndex(
        (item: any) =>
          item.product.id === product.id &&
          (item.size || "") === selectedSize &&
          (item.color || "") === selectedColor,
      );

      if (existingIndex > -1) {
        existingCart[existingIndex].quantity += quantity;
      } else {
        existingCart.push({ product, quantity, size: selectedSize, color: selectedColor });
      }

      localStorage.setItem("egyrock_cart", JSON.stringify(existingCart));

      // Trigger custom cart update event
      window.dispatchEvent(new Event("cart-updated"));

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Failed adding to cart:", err);
    }
  }

  return (
    <div className="space-y-4">
      {/* Color selector (wearables) */}
      {hasColors && (
        <div>
          <span className="block text-xs uppercase tracking-wider text-ink mb-2">
            {isArabic ? "اللون" : "Color"}
            {colorMissing && (
              <span className="text-warning normal-case">
                {" "}
                — {isArabic ? "اختر لوناً" : "Please select a color"}
              </span>
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                className={`min-w-[44px] px-3.5 py-2 text-sm uppercase border-2 transition cursor-pointer ${
                  color === c
                    ? "border-brand bg-brand text-white shadow-[2px_2px_0px_black]"
                    : "border-line bg-canvas text-ink hover:border-brand"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size selector (wearables) */}
      {hasSizes && (
        <div>
          <span className="block text-xs uppercase tracking-wider text-ink mb-2">
            {isArabic ? "المقاس" : "Size"}
            {sizeMissing && (
              <span className="text-warning normal-case">
                {" "}
                — {isArabic ? "اختر مقاساً" : "Please select a size"}
              </span>
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`min-w-[44px] px-3 py-2 text-sm uppercase border-2 transition cursor-pointer ${
                  size === s
                    ? "border-brand bg-brand text-white shadow-[2px_2px_0px_black]"
                    : "border-line bg-canvas text-ink hover:border-brand"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!isOut && (
          <div className="flex items-center border-2 border-line bg-canvas">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="px-3 py-2 text-sm text-ink hover:bg-surface-2 disabled:opacity-40 cursor-pointer"
            >
              -
            </button>
            <span className="px-4 py-2 text-sm font-mono text-ink">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
              disabled={quantity >= product.quantity}
              className="px-3 py-2 text-sm text-ink hover:bg-surface-2 disabled:opacity-40 cursor-pointer"
            >
              +
            </button>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={isOut || sizeMissing || colorMissing}
          className={`flex-grow py-3.5 px-6 font-heading uppercase text-sm sm:text-base tracking-wider transition border-2 ${
            isOut || sizeMissing || colorMissing
              ? "border-line bg-surface text-muted cursor-not-allowed"
              : added
                ? "border-success bg-success text-white"
                : "border-black bg-brand hover:bg-brand-strong text-white shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_black] cursor-pointer"
          }`}
        >
          {isOut
            ? isArabic
              ? "نفدت الكمية من المخزن"
              : "OUT OF STOCK"
            : colorMissing
              ? isArabic
                ? "اختر اللون أولاً"
                : "SELECT A COLOR"
              : sizeMissing
                ? isArabic
                  ? "اختر المقاس أولاً"
                  : "SELECT A SIZE"
                : added
                  ? isArabic
                    ? "تمت الإضافة إلى السلة! ✓"
                    : "ADDED TO CART! ✓"
                  : isArabic
                    ? `أضف ${quantity > 1 ? quantity : ""} إلى السلة`
                    : `ADD TO CART`}
        </button>
      </div>

      <p className="text-[11px] text-muted">
        {isArabic
          ? "* تنبيه: إضافة المنتجات إلى السلة لا تخصم من المخزن. يتم خصم الكمية فقط عند تأكيد الإيصال من الإدارة."
          : "* Note: Stock quantity is NOT decremented upon adding to cart. Stock is decremented only upon admin payment verification."}
      </p>
    </div>
  );
}
