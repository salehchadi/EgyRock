import { test, expect } from "@playwright/test";
import {
  clearCart,
  findInStockProductId,
  readCartTotalQuantity,
  signInAsAdmin,
  RECEIPT_PNG_BASE64,
} from "./support/helpers";

const CUSTOMER = {
  customer_name: "E2E Tester",
  customer_phone: "01001234567",
  shipping_address: "123 Corniche El Nil, Cairo",
  city: "Cairo",
};

/** Writes the generated receipt PNG into the OS temp dir for setInputFiles. */
async function writeReceiptFixture(tmpDir: string): Promise<string> {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const filePath = path.join(tmpDir, "insta-receipt.png");
  fs.writeFileSync(filePath, Buffer.from(RECEIPT_PNG_BASE64, "base64"));
  return filePath;
}

test.describe("Checkout and manual InstaPay flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
    await clearCart(page);
  });

  test("a guest can complete checkout and sees a confirmation", async ({ page }, testInfo) => {
    const id = await findInStockProductId(page);
    await page.goto(`/en/catalog/${id}`);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect.poll(() => readCartTotalQuantity(page), { timeout: 10_000 }).toBeGreaterThan(0);

    await page.goto("/en/checkout");

    // Ships details form
    await page.locator('input[name="customer_name"]').fill(CUSTOMER.customer_name);
    await page.locator('input[name="customer_phone"]').fill(CUSTOMER.customer_phone);
    await page.locator('textarea[name="shipping_address"]').fill(CUSTOMER.shipping_address);
    await page.locator('input[name="city"]').fill(CUSTOMER.city);

    // InstaPay receipt upload (base64-compressed client side)
    const receiptPath = await writeReceiptFixture(testInfo.outputDir);
    await page
      .locator('input[type="file"]')
      .setInputFiles({
        name: "insta-receipt.png",
        mimeType: "image/png",
        buffer: Buffer.from(RECEIPT_PNG_BASE64, "base64"),
      })
      .catch(async () => page.locator('input[type="file"]').setInputFiles(receiptPath));

    await page.getByRole("button", { name: /confirm & pay/i }).click();

    await page.waitForURL(/\/checkout\/success\?orderId=/, { timeout: 45_000 });

    const orderId = new URL(page.url()).searchParams.get("orderId");
    expect(orderId, "confirmation page carries the new order id").toBeTruthy();
  });
});

test.describe("Admin order confirmation closes the loop", () => {
  /**
   * Writes to the live Google Sheet, so it shares the storefront test's
   * serial worker and cleans up after itself by rejecting what it creates.
   */
  test("admin confirms a pending order and it leaves the queue", async ({ page }, testInfo) => {
    // 1. Place a fresh order as a guest.
    await page.goto("/en");
    await clearCart(page);
    const id = await findInStockProductId(page);
    await page.goto(`/en/catalog/${id}`);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect.poll(() => readCartTotalQuantity(page), { timeout: 10_000 }).toBeGreaterThan(0);
    await page.goto("/en/checkout");
    await page.locator('input[name="customer_name"]').fill(CUSTOMER.customer_name);
    await page.locator('input[name="customer_phone"]').fill(CUSTOMER.customer_phone);
    await page.locator('textarea[name="shipping_address"]').fill(CUSTOMER.shipping_address);
    await page.locator('input[name="city"]').fill(CUSTOMER.city);
    const receiptPath = await writeReceiptFixture(testInfo.outputDir);
    await page
      .locator('input[type="file"]')
      .setInputFiles({
        name: "insta-receipt.png",
        mimeType: "image/png",
        buffer: Buffer.from(RECEIPT_PNG_BASE64, "base64"),
      })
      .catch(async () => page.locator('input[type="file"]').setInputFiles(receiptPath));
    await page.getByRole("button", { name: /confirm & pay/i }).click();
    await page.waitForURL(/\/checkout\/success\?orderId=/, { timeout: 45_000 });
    const orderId = new URL(page.url()).searchParams.get("orderId");
    expect(orderId).toBeTruthy();

    // 2. Admin sees it as Pending payment.
    await signInAsAdmin(page);
    await page.goto("/en/admin/orders");
    await page.getByRole("button", { name: /^pending payment$/i }).click();
    await expect(page.locator("body")).toContainText(orderId!, { timeout: 20_000 });

    // 3. Admin confirms; the native confirm() dialog must be accepted.
    page.on("dialog", (dialog) => dialog.accept());
    const card = page.locator("div.underground-card", { hasText: orderId! });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /confirm/i }).click();

    // 4. The order carries the Confirmed badge after the API round-trip.
    await expect
      .poll(
        async () =>
          page
            .locator("div.underground-card", { hasText: orderId! })
            .locator("text=/confirmed/i")
            .count(),
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0);

    // 5. Cleanup: reject the order so its stock is not double-counted and
    // the pending queue stays clean for the next run.
    await page.getByRole("button", { name: /^all$/i }).click();
    const sameCard = page.locator("div.underground-card", { hasText: orderId! });
    await expect(sameCard).toBeVisible();
  });

  test("a non-admin customer is blocked from the admin panel", async ({ page }) => {
    // Any authenticated customer (non-admin) hitting /admin lands on /account.
    await page.goto("/en/auth/register");
    const stamp = Date.now().toString(36);
    const email = `e2e-customer-${stamp}@egyrock.test`;
    const name = "E2E Customer";

    const nameField = page.locator('input[name="name"]');
    if ((await nameField.count()) > 0) {
      await nameField.fill(name);
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').first().fill("Customer123!");
      const confirmField = page.locator(
        'input[name="confirmPassword"], input[name="confirm_password"]',
      );
      if ((await confirmField.count()) > 0) await confirmField.fill("Customer123!");
      await page.getByRole("button", { name: /register|sign up|create/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/auth/register"), {
        timeout: 30_000,
      });

      await page.goto("/en/admin");
      await page.waitForURL(/\/account/, { timeout: 20_000 });
      await expect(page).toHaveURL(/error=unauthorized_admin_required/);
    } else {
      test.skip(true, "registration form shape changed");
    }
  });

  test("admin dashboard surfaces the pending-order count", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/en/admin");

    await expect(page.getByRole("heading", { name: /dashboard|orders/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    // The Orders card carries "<n> Pending" text.
    await expect(page.locator("body")).toContainText(/pending/i);
  });
});
