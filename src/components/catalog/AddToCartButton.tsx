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

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    if (isOut) return;

    try {
      const existingCart = JSON.parse(localStorage.getItem("egyrock_cart") || "[]");
      const existingIndex = existingCart.findIndex((item: any) => item.product.id === product.id);

      const currentInCart = existingIndex > -1 ? existingCart[existingIndex].quantity : 0;
      const newTotalQuantity = currentInCart + quantity;

      if (newTotalQuantity > product.quantity) {
        alert(
          isArabic
            ? `عفواً، الكمية المتاحة في المخزن هي ${product.quantity} فقط`
            : `Cannot add more than available stock (${product.quantity} available)`,
        );
        return;
      }

      if (existingIndex > -1) {
        existingCart[existingIndex].quantity = newTotalQuantity;
      } else {
        existingCart.push({ product, quantity });
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
      <div className="flex items-center gap-4">
        {!isOut && (
          <div className="flex items-center border-2 border-[#3f3b35] bg-[#1c1a17]">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="px-3 py-2 text-sm text-[#f2ede4] hover:bg-[#332f2a] disabled:opacity-40 cursor-pointer font-bold"
            >
              -
            </button>
            <span className="px-4 py-2 text-sm font-mono font-bold text-[#f2ede4]">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
              disabled={quantity >= product.quantity}
              className="px-3 py-2 text-sm text-[#f2ede4] hover:bg-[#332f2a] disabled:opacity-40 cursor-pointer font-bold"
            >
              +
            </button>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={isOut}
          className={`flex-grow py-3.5 px-6 font-heading uppercase text-sm sm:text-base tracking-wider transition border-2 ${
            isOut
              ? "border-[#3f3b35] bg-[#282521] text-[#9e978e] cursor-not-allowed"
              : added
                ? "border-[#2ea043] bg-[#2ea043] text-white"
                : "border-black bg-[#e0562c] hover:bg-[#c44721] text-white shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_black] cursor-pointer"
          }`}
        >
          {isOut
            ? isArabic
              ? "نفدت الكمية من المخزن"
              : "OUT OF STOCK"
            : added
              ? isArabic
                ? "تمت الإضافة إلى السلة! ✓"
                : "ADDED TO CART! ✓"
              : isArabic
                ? `أضف ${quantity > 1 ? quantity : ""} إلى السلة`
                : `ADD TO CART`}
        </button>
      </div>

      <p className="text-[11px] text-[#9e978e]">
        {isArabic
          ? "* تنبيه: إضافة المنتجات إلى السلة لا تخصم من المخزن. يتم خصم الكمية فقط عند تأكيد الإيصال من الإدارة."
          : "* Note: Stock quantity is NOT decremented upon adding to cart. Stock is decremented only upon admin payment verification."}
      </p>
    </div>
  );
}
