/**
 * Verify stock status badge logic.
 *
 * Tests that the calculateStockStatus utility produces the correct
 * badge state for various quantity values:
 *   - quantity === 0  →  "out_of_stock"
 *   - 0 < quantity <= 5  →  "countdown"
 *   - quantity > 5  →  "in_stock"
 *
 * Run: npx tsx scripts/verify-stock.ts
 */

import { calculateStockStatus, DEFAULT_LOW_STOCK_THRESHOLD } from "../src/lib/stock";

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ PASS: ${label}`);
  }
}

console.log("═══════════════════════════════════════════════");
console.log("  EgyRock — Stock Status Verification Script");
console.log("═══════════════════════════════════════════════\n");
console.log(`Low-stock threshold: ${DEFAULT_LOW_STOCK_THRESHOLD}\n`);

// --- Out of Stock ---
console.log("▸ Testing quantity = 0 (out of stock)");
const outOfStock = calculateStockStatus(0);
assert(outOfStock.status === "out_of_stock", "status is 'out_of_stock'");
assert(outOfStock.isAvailable === false, "isAvailable is false");
assert(outOfStock.isLowStock === false, "isLowStock is false");
assert(outOfStock.quantity === 0, "quantity is 0");

// --- Out of Stock (negative edge case) ---
console.log("\n▸ Testing quantity = -3 (negative → treated as 0)");
const negative = calculateStockStatus(-3);
assert(negative.status === "out_of_stock", "status is 'out_of_stock'");
assert(negative.isAvailable === false, "isAvailable is false");
assert(negative.quantity === 0, "quantity clamped to 0");

// --- Countdown: quantity = 1 ---
console.log("\n▸ Testing quantity = 1 (countdown)");
const cd1 = calculateStockStatus(1);
assert(cd1.status === "countdown", "status is 'countdown'");
assert(cd1.isAvailable === true, "isAvailable is true");
assert(cd1.isLowStock === true, "isLowStock is true");
assert(cd1.quantity === 1, "quantity is 1");

// --- Countdown: quantity = 3 ---
console.log("\n▸ Testing quantity = 3 (countdown)");
const cd3 = calculateStockStatus(3);
assert(cd3.status === "countdown", "status is 'countdown'");
assert(cd3.isAvailable === true, "isAvailable is true");
assert(cd3.isLowStock === true, "isLowStock is true");
assert(cd3.quantity === 3, "quantity is 3");

// --- Countdown: quantity = 5 (boundary) ---
console.log("\n▸ Testing quantity = 5 (boundary, should be countdown)");
const cd5 = calculateStockStatus(5);
assert(cd5.status === "countdown", "status is 'countdown'");
assert(cd5.isAvailable === true, "isAvailable is true");
assert(cd5.isLowStock === true, "isLowStock is true");
assert(cd5.quantity === 5, "quantity is 5");

// --- In Stock: quantity = 6 (just above threshold) ---
console.log("\n▸ Testing quantity = 6 (just above threshold → in stock)");
const is6 = calculateStockStatus(6);
assert(is6.status === "in_stock", "status is 'in_stock'");
assert(is6.isAvailable === true, "isAvailable is true");
assert(is6.isLowStock === false, "isLowStock is false");
assert(is6.quantity === 6, "quantity is 6");

// --- In Stock: quantity = 100 ---
console.log("\n▸ Testing quantity = 100 (in stock)");
const is100 = calculateStockStatus(100);
assert(is100.status === "in_stock", "status is 'in_stock'");
assert(is100.isAvailable === true, "isAvailable is true");
assert(is100.isLowStock === false, "isLowStock is false");
assert(is100.quantity === 100, "quantity is 100");

// --- Custom threshold ---
console.log("\n▸ Testing custom threshold = 10, quantity = 8 (countdown)");
const customCd = calculateStockStatus(8, 10);
assert(customCd.status === "countdown", "status is 'countdown' with threshold 10");
assert(customCd.isLowStock === true, "isLowStock is true");

console.log("\n▸ Testing custom threshold = 10, quantity = 11 (in stock)");
const customIs = calculateStockStatus(11, 10);
assert(customIs.status === "in_stock", "status is 'in_stock' with threshold 10");
assert(customIs.isLowStock === false, "isLowStock is false");

console.log("\n═══════════════════════════════════════════════");
if (process.exitCode === 1) {
  console.log("  ✗ SOME TESTS FAILED — see above");
} else {
  console.log("  ✓ ALL STOCK STATUS TESTS PASSED");
}
console.log("═══════════════════════════════════════════════\n");
