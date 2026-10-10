import { test, expect } from "@playwright/test";
import { acceptDialogs, signInAsAdmin, uniqueStamp } from "./support/helpers";

const HERO_IMG = "/images/placeholders/egyrock-1.jpeg";

test.describe("Admin storefront tooling (Coupons, Pages, Hero, Translations)", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("admin can create and delete a coupon", async ({ page }) => {
    const code = `E2E${uniqueStamp()}`.toUpperCase();

    await page.goto("/en/admin/coupons");
    await page.getByRole("button", { name: /\+ add coupon/i }).click();

    await page.locator('input[name="code"]').fill(code);
    await page.locator('input[name="value"]').fill("10");
    await page.getByRole("button", { name: "Save Coupon" }).click();

    const row = page.locator("tbody tr", { hasText: code });
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(row).toContainText("10%");

    acceptDialogs(page);
    await row.getByRole("button", { name: /^delete$/i }).click();
    await expect(row).toHaveCount(0, { timeout: 20_000 });
  });

  test("admin can build a sectioned page and it renders on the storefront", async ({ page }) => {
    const stamp = uniqueStamp();
    const slug = `e2e-page-${stamp}`;
    const title = `E2E Page ${stamp}`;
    const heading = `E2E Section Heading ${stamp}`;

    // ---- Create with a heading block via the section builder ----
    await page.goto("/en/admin/pages");
    await page.getByRole("button", { name: /\+ new page/i }).click();

    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('input[name="title_en"]').fill(title);
    await page.locator('input[name="title_ar"]').fill(`صفحة ${stamp}`);
    await page.locator('input[name="title_fr"]').fill(`Page ${stamp}`);

    await page.getByRole("button", { name: /\+ heading/i }).click();

    const sectionCard = page
      .locator("div.border-2.border-line.bg-surface")
      .filter({ has: page.getByText("Heading text") });
    await expect(sectionCard).toBeVisible();
    await sectionCard.locator("input").first().fill(heading);

    // Live preview uses the same renderer as the storefront.
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.locator("body")).toContainText(heading);

    await page.getByRole("button", { name: "Save Page" }).click();

    const row = page.locator("tbody tr", { hasText: title });
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(row).toContainText("1 block");

    // ---- Renders live at /pages/{slug} ----
    await page.goto(`/en/pages/${slug}`);
    await expect(page.getByRole("heading", { name: new RegExp(heading, "i") })).toBeVisible({
      timeout: 20_000,
    });

    // ---- Delete (self-cleanup) ----
    await page.goto("/en/admin/pages");
    const row2 = page.locator("tbody tr", { hasText: title });
    await expect(row2).toBeVisible({ timeout: 20_000 });
    acceptDialogs(page);
    await row2.getByRole("button", { name: /^delete$/i }).click();
    await expect(row2).toHaveCount(0, { timeout: 20_000 });

    await page.goto(`/en/pages/${slug}`);
    await expect(page.locator("body")).toContainText("404", { timeout: 20_000 });
  });

  test("admin can add and delete a hero slide", async ({ page }) => {
    const stamp = uniqueStamp();
    const title = `E2E Slide ${stamp}`;

    await page.goto("/en/admin/hero");
    await page.getByRole("button", { name: /\+ add slide/i }).click();

    await page.locator('input[name="image_url"]').fill(HERO_IMG);
    await page.locator('input[name="title_en"]').fill(title);
    await page.getByRole("button", { name: "Save Slide" }).click();

    const card = page.locator("div.underground-card", { hasText: title });
    await expect(card).toBeVisible({ timeout: 20_000 });

    acceptDialogs(page);
    await card.getByRole("button", { name: /^delete$/i }).click();
    await expect(page.locator("div.underground-card", { hasText: title })).toHaveCount(0, {
      timeout: 20_000,
    });
  });

  test("admin can edit a UI translation and revert it", async ({ page }) => {
    await page.goto("/en/admin/translations");

    const row = page.locator("tbody tr").first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    const key = (await row.locator("td").nth(0).innerText()).trim();
    const original = (await row.locator("td").nth(1).innerText()).trim();

    const tampered = `${original} [E2E]`;
    await row.getByRole("button", { name: /^edit$/i }).click();
    await row.locator("td").nth(1).locator("input").fill(tampered);
    await row.getByRole("button", { name: /^save$/i }).click();

    const editedRow = page.locator("tbody tr", { hasText: key });
    await expect(editedRow).toContainText(tampered, { timeout: 20_000 });

    // Revert so the live sheet is left untouched.
    await editedRow.getByRole("button", { name: /^edit$/i }).click();
    await editedRow.locator("td").nth(1).locator("input").fill(original);
    await editedRow.getByRole("button", { name: /^save$/i }).click();

    const restoredRow = page.locator("tbody tr", { hasText: key });
    await expect(restoredRow).toContainText(original, { timeout: 20_000 });
    await expect(restoredRow).not.toContainText("[E2E]");
  });
});
