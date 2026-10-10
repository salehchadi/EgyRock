import { test, expect } from "@playwright/test";
import { acceptDialogs, signInAsAdmin, uniqueStamp } from "./support/helpers";

const IMG = "/images/placeholders/egyrock-1.jpeg";

test.describe("Admin catalog management (Products & Categories)", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("admin can create, edit, and delete a product", async ({ page }) => {
    const stamp = uniqueStamp();
    const name = `E2E Tee ${stamp}`;

    // ---- Create ----
    await page.goto("/en/admin/products");
    await page.getByRole("button", { name: /\+ add product/i }).click();

    await page.locator('input[name="name_en"]').fill(name);
    await page.locator('input[name="name_ar"]').fill(`تي شيرت ${stamp}`);
    await page.locator('input[name="name_fr"]').fill(`Tee ${stamp}`);
    await page.locator('textarea[name="desc_en"]').fill("Created by the Playwright admin suite.");
    await page.locator('input[name="price"]').fill("350");
    await page.locator('input[name="quantity"]').fill("40");
    await page
      .locator('select[name="category_id"]')
      .selectOption({ index: 0 })
      .catch(() => {});
    await page.locator('input[name="images"]').fill(IMG);
    await page.locator('input[name="sizes"]').fill("S, M, L");

    await page.getByRole("button", { name: "Save Product" }).click();

    const row = page.locator("tbody tr", { hasText: name });
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(row).toContainText("40");

    // The product is live on the storefront catalog.
    await page.goto("/en/catalog");
    await expect(page.locator("body")).toContainText(name, { timeout: 20_000 });

    // ---- Edit: change stock + name ----
    const renamed = `${name} V2`;
    await page.goto("/en/admin/products");
    const row2 = page.locator("tbody tr", { hasText: name });
    await expect(row2).toBeVisible({ timeout: 20_000 });
    await row2.getByRole("button", { name: /^edit$/i }).click();

    await page.locator('input[name="name_en"]').fill(renamed);
    await page.locator('input[name="quantity"]').fill("7");
    await page.getByRole("button", { name: "Save Product" }).click();

    const row3 = page.locator("tbody tr", { hasText: renamed });
    await expect(row3).toBeVisible({ timeout: 20_000 });
    await expect(row3).toContainText("7");

    // ---- Delete (self-cleanup) ----
    acceptDialogs(page);
    await row3.getByRole("button", { name: /^delete$/i }).click();
    await expect(row3).toHaveCount(0, { timeout: 20_000 });
  });

  test("admin can create, rename, and delete a category", async ({ page }) => {
    const stamp = uniqueStamp();
    const baseName = `E2E Gear ${stamp}`;

    // ---- Create ----
    await page.goto("/en/admin/categories");
    await page.getByRole("button", { name: /\+ add category/i }).click();

    await page.locator('input[name="name_en"]').fill(baseName);
    await page.locator('input[name="name_ar"]').fill(`معدات ${stamp}`);
    await page.locator('input[name="name_fr"]').fill(`Matériel ${stamp}`);
    await page.getByRole("button", { name: "Save Category" }).click();

    const row = page.locator("tbody tr", { hasText: baseName });
    await expect(row).toBeVisible({ timeout: 20_000 });

    // ---- Rename ----
    const renamed = `${baseName} Pro`;
    await row.getByRole("button", { name: /^edit$/i }).click();
    await page.locator('input[name="name_en"]').fill(renamed);
    await page.getByRole("button", { name: "Save Category" }).click();

    const renamedRow = page.locator("tbody tr", { hasText: renamed });
    await expect(renamedRow).toBeVisible({ timeout: 20_000 });

    // ---- Delete (self-cleanup) ----
    acceptDialogs(page);
    await renamedRow.getByRole("button", { name: /^delete$/i }).click();
    await expect(renamedRow).toHaveCount(0, { timeout: 20_000 });
  });
});
