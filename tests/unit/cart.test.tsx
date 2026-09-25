import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/components/providers/CartProvider";
import type { Product } from "@/types";

const CART_KEY = "egyrock_cart";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "riff-tee",
    category_id: "t-shirts",
    name_en: "Riff Tee",
    name_ar: "ØªÙŠØ´ÙŠØ±Øª",
    name_fr: "Tee",
    desc_en: "Heavyweight cotton",
    desc_ar: "",
    desc_fr: "",
    price: 250,
    quantity: 3,
    images: ["/images/placeholders/egyrock-1.jpeg"],
    created_at: "2026-01-01T00:00:00.000Z",
    sizes: [],
    ...overrides,
  };
}

let cart!: ReturnType<typeof useCart>;

function Probe() {
  const value = useCart();
  React.useEffect(() => {
    cart = value;
  }, [value]);
  return null;
}

function renderCart() {
  return render(
    <CartProvider>
      <Probe />
    </CartProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CartProvider quantity logic", () => {
  it("starts empty when localStorage holds nothing", () => {
    renderCart();

    expect(cart.items).toEqual([]);
    expect(cart.totalItems).toBe(0);
    expect(cart.totalPrice).toBe(0);
  });

  it("hydrates the cart from localStorage on mount", () => {
    localStorage.setItem(CART_KEY, JSON.stringify([{ product: makeProduct(), quantity: 2 }]));

    renderCart();

    expect(cart.items).toHaveLength(1);
    expect(cart.totalItems).toBe(2);
    expect(cart.totalPrice).toBe(500);
  });

  it("ignores corrupt localStorage payloads instead of throwing", () => {
    localStorage.setItem(CART_KEY, "{not json");

    expect(() => renderCart()).not.toThrow();
    expect(cart.items).toEqual([]);
  });

  it("adds an item and reports running totals", () => {
    renderCart();
    const mug = makeProduct({ id: "mug", price: 120, quantity: 10 });

    let added = false;
    act(() => {
      added = cart.addItem(mug, 2);
    });

    expect(added).toBe(true);
    expect(cart.items).toHaveLength(1);
    expect(cart.totalItems).toBe(2);
    expect(cart.totalPrice).toBe(240);
  });

  it("merges repeat adds of the same product into one line item", () => {
    renderCart();
    const tee = makeProduct({ quantity: 5 });

    act(() => {
      cart.addItem(tee, 1);
    });
    act(() => {
      cart.addItem(tee, 3);
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(4);
    expect(cart.totalItems).toBe(4);
  });

  describe("stock ceiling", () => {
    it("refuses an add that exceeds the available quantity", () => {
      renderCart();
      const tee = makeProduct({ quantity: 3 });

      let added = true;
      act(() => {
        added = cart.addItem(tee, 4);
      });

      expect(added).toBe(false);
      expect(cart.items).toEqual([]);
    });

    it("refuses an add that only exceeds stock once existing cart quantity is counted", () => {
      renderCart();
      const tee = makeProduct({ quantity: 3 });

      act(() => {
        cart.addItem(tee, 2);
      });

      let added = true;
      act(() => {
        added = cart.addItem(tee, 2);
      });

      expect(added).toBe(false);
      expect(cart.items[0].quantity).toBe(2);
    });

    it("allows an add that lands exactly on the available quantity", () => {
      renderCart();
      const tee = makeProduct({ quantity: 3 });

      let added = false;
      act(() => {
        added = cart.addItem(tee, 3);
      });

      expect(added).toBe(true);
      expect(cart.items[0].quantity).toBe(3);
    });

    it("refuses to add an out-of-stock product", () => {
      renderCart();
      const soldOut = makeProduct({ quantity: 0 });

      let added = true;
      act(() => {
        added = cart.addItem(soldOut, 1);
      });

      expect(added).toBe(false);
      expect(cart.items).toEqual([]);
    });

    it("clamps updateQuantity to the available quantity", () => {
      renderCart();
      const tee = makeProduct({ quantity: 4 });

      act(() => {
        cart.addItem(tee, 1);
      });
      act(() => {
        cart.updateQuantity(tee.id, 99);
      });

      expect(cart.items[0].quantity).toBe(4);
      expect(cart.totalItems).toBe(4);
    });
  });

  describe("removal", () => {
    it("removes the line item when quantity is set to zero", () => {
      renderCart();
      const tee = makeProduct();

      act(() => {
        cart.addItem(tee, 2);
      });
      act(() => {
        cart.updateQuantity(tee.id, 0);
      });

      expect(cart.items).toEqual([]);
    });

    it("removes the line item when quantity is set below zero", () => {
      renderCart();
      const tee = makeProduct();

      act(() => {
        cart.addItem(tee, 2);
      });
      act(() => {
        cart.updateQuantity(tee.id, -5);
      });

      expect(cart.items).toEqual([]);
    });

    it("removes a product explicitly", () => {
      renderCart();
      const tee = makeProduct({ id: "tee" });
      const mug = makeProduct({ id: "mug" });

      act(() => {
        cart.addItem(tee, 1);
        cart.addItem(mug, 1);
      });
      act(() => {
        cart.removeItem("tee");
      });

      expect(cart.items.map((i) => i.product.id)).toEqual(["mug"]);
    });

    it("is a no-op when updating a product that is not in the cart", () => {
      renderCart();
      const tee = makeProduct();

      act(() => {
        cart.addItem(tee, 1);
      });
      act(() => {
        cart.updateQuantity("not-in-cart", 5);
      });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(1);
    });

    it("empties the cart and localStorage on clearCart", () => {
      renderCart();
      const tee = makeProduct();

      act(() => {
        cart.addItem(tee, 2);
      });
      act(() => {
        cart.clearCart();
      });

      expect(cart.items).toEqual([]);
      expect(cart.totalItems).toBe(0);
      expect(JSON.parse(localStorage.getItem(CART_KEY) || "[]")).toEqual([]);
    });

    it("leaves other line items untouched when removing an unknown product", () => {
      renderCart();
      const tee = makeProduct();

      act(() => {
        cart.addItem(tee, 1);
      });
      act(() => {
        cart.removeItem("does-not-exist");
      });

      expect(cart.items).toHaveLength(1);
    });
  });

  describe("persistence", () => {
    it("persists the cart to localStorage under egyrock_cart", () => {
      renderCart();
      const tee = makeProduct();

      act(() => {
        cart.addItem(tee, 2);
      });

      const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].product.id).toBe("riff-tee");
      expect(stored[0].quantity).toBe(2);
    });

    it("broadcasts a cart-updated event so the header badge refreshes", () => {
      renderCart();
      const listener = vi.fn();
      window.addEventListener("cart-updated", listener);

      act(() => {
        cart.addItem(makeProduct(), 1);
      });

      expect(listener).toHaveBeenCalled();
      window.removeEventListener("cart-updated", listener);
    });

    it("survives a remount by re-reading localStorage", () => {
      const first = renderCart();
      act(() => {
        cart.addItem(makeProduct({ quantity: 3 }), 2);
      });
      first.unmount();

      renderCart();

      expect(cart.items).toHaveLength(1);
      expect(cart.totalItems).toBe(2);
    });
  });

  /**
   * AGENTS.md rule 3 / PROJECT_SPEC.md Â§3:
   * stock is decremented ONLY when an admin confirms a payment receipt.
   * Adding to the cart must never hit the network.
   */
  describe("stock decrement rule", () => {
    it("never issues a network request when items are added, updated or removed", () => {
      renderCart();
      const tee = makeProduct({ quantity: 5 });

      act(() => {
        cart.addItem(tee, 2);
      });
      act(() => {
        cart.updateQuantity(tee.id, 3);
      });
      act(() => {
        cart.removeItem(tee.id);
      });
      act(() => {
        cart.clearCart();
      });

      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("does not mutate the product's quantity field", () => {
      renderCart();
      const tee = makeProduct({ quantity: 5 });

      act(() => {
        cart.addItem(tee, 2);
      });

      expect(tee.quantity).toBe(5);
      expect(cart.items[0].product.quantity).toBe(5);
    });
  });
});
