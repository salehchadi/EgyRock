import { StockStatusType } from "@/components/ui/PosterBadge";

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export interface StockCalculation {
  status: StockStatusType;
  isAvailable: boolean;
  isLowStock: boolean;
  quantity: number;
}

/**
 * Single source of truth stock calculator.
 * quantity = 0 -> "out_of_stock"
 * quantity <= threshold -> "countdown" ("Only X left")
 * otherwise -> "in_stock"
 */
export function calculateStockStatus(
  quantity: number,
  threshold = DEFAULT_LOW_STOCK_THRESHOLD,
): StockCalculation {
  const safeQty = Math.max(0, quantity);

  if (safeQty === 0) {
    return {
      status: "out_of_stock",
      isAvailable: false,
      isLowStock: false,
      quantity: 0,
    };
  }

  if (safeQty <= threshold) {
    return {
      status: "countdown",
      isAvailable: true,
      isLowStock: true,
      quantity: safeQty,
    };
  }

  return {
    status: "in_stock",
    isAvailable: true,
    isLowStock: false,
    quantity: safeQty,
  };
}
