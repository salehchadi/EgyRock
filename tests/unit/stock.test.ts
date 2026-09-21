import { describe, it, expect } from "vitest";
import { calculateStockStatus, DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/stock";

/**
 * PROJECT_SPEC.md §3 — Stock Management & Inventory Logic
 *   quantity === 0                      -> out of stock
 *   0 < quantity <= lowStockThreshold   -> countdown ("Only X left")
 *   quantity > lowStockThreshold        -> in stock
 */
describe("calculateStockStatus", () => {
  it("uses a default low-stock threshold of 5", () => {
    expect(DEFAULT_LOW_STOCK_THRESHOLD).toBe(5);
  });

  describe("out of stock", () => {
    it("reports out_of_stock and unavailability at quantity 0", () => {
      const result = calculateStockStatus(0);

      expect(result.status).toBe("out_of_stock");
      expect(result.isAvailable).toBe(false);
      expect(result.isLowStock).toBe(false);
      expect(result.quantity).toBe(0);
    });

    it("clamps negative quantities to 0 and treats them as out of stock", () => {
      const result = calculateStockStatus(-12);

      expect(result.status).toBe("out_of_stock");
      expect(result.isAvailable).toBe(false);
      expect(result.quantity).toBe(0);
    });

    it("stays out of stock even with a large threshold", () => {
      expect(calculateStockStatus(0, 999).status).toBe("out_of_stock");
    });
  });

  describe("low-stock countdown", () => {
    it("reports countdown for every quantity strictly below the threshold", () => {
      for (const qty of [1, 2, 3, 4]) {
        const result = calculateStockStatus(qty);
        expect(result.status).toBe("countdown");
        expect(result.isLowStock).toBe(true);
        expect(result.isAvailable).toBe(true);
        expect(result.quantity).toBe(qty);
      }
    });

    it("includes the threshold itself in the countdown band (boundary)", () => {
      const result = calculateStockStatus(5);

      expect(result.status).toBe("countdown");
      expect(result.isLowStock).toBe(true);
      expect(result.isAvailable).toBe(true);
    });

    it("remains purchasable while in the countdown band", () => {
      expect(calculateStockStatus(1).isAvailable).toBe(true);
    });

    it("honours a custom threshold", () => {
      expect(calculateStockStatus(10, 10).status).toBe("countdown");
      expect(calculateStockStatus(10, 20).status).toBe("countdown");
    });
  });

  describe("in stock", () => {
    it("reports in_stock one unit above the threshold (boundary)", () => {
      const result = calculateStockStatus(6);

      expect(result.status).toBe("in_stock");
      expect(result.isLowStock).toBe(false);
      expect(result.isAvailable).toBe(true);
      expect(result.quantity).toBe(6);
    });

    it("honours a custom threshold", () => {
      expect(calculateStockStatus(11, 10).status).toBe("in_stock");
      expect(calculateStockStatus(100, 3).status).toBe("in_stock");
    });

    it("treats any stock as in_stock when the threshold is 0", () => {
      expect(calculateStockStatus(1, 0).status).toBe("in_stock");
      expect(calculateStockStatus(0, 0).status).toBe("out_of_stock");
    });
  });

  it("never reports an item as low stock and out of stock at the same time", () => {
    for (const qty of [0, 1, 5, 6, 500]) {
      const result = calculateStockStatus(qty);
      expect(result.isLowStock && !result.isAvailable).toBe(false);
    }
  });

  it("only marks items unavailable when they are out of stock", () => {
    for (const qty of [0, 1, 5, 6, 500]) {
      const result = calculateStockStatus(qty);
      expect(result.isAvailable).toBe(result.status !== "out_of_stock");
    }
  });
});
