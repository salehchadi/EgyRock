"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { Product } from "@/types";

const CART_KEY = "egyrock_cart";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, qty: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const isMounted = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    isMounted.current = true;
    const saved = readCart();
    if (isMounted.current) {
      setItems(saved);
    }
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Listen for cross-component cart updates (e.g. from AddToCartButton)
  useEffect(() => {
    function handleCartUpdate() {
      setItems(readCart());
    }
    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  /**
   * Add item to cart. Returns false if stock limit would be exceeded.
   * NOTE: This does NOT decrement stock in the database.
   */
  const addItem = useCallback((product: Product, qty: number): boolean => {
    const current = readCart();
    const existingIdx = current.findIndex((i) => i.product.id === product.id);
    const currentInCart = existingIdx > -1 ? current[existingIdx].quantity : 0;
    const newTotal = currentInCart + qty;

    if (newTotal > product.quantity) {
      return false; // Would exceed stock
    }

    if (existingIdx > -1) {
      current[existingIdx].quantity = newTotal;
    } else {
      current.push({ product, quantity: qty });
    }

    writeCart(current);
    setItems(current);
    return true;
  }, []);

  const removeItem = useCallback((productId: string) => {
    const current = readCart().filter((i) => i.product.id !== productId);
    writeCart(current);
    setItems(current);
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    const current = readCart();
    const idx = current.findIndex((i) => i.product.id === productId);
    if (idx === -1) return;

    if (qty <= 0) {
      current.splice(idx, 1);
    } else {
      // Enforce max stock
      const maxQty = current[idx].product.quantity;
      current[idx].quantity = Math.min(qty, maxQty);
    }

    writeCart(current);
    setItems(current);
  }, []);

  const clearCart = useCallback(() => {
    writeCart([]);
    setItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
