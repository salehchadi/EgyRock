import { test, expect } from "@playwright/test";
import { LOCALES, findInStockProductId, readCartTotalQuantity } from "./support/helpers";

test.describe("Storefront browsing across all three locales", () => {
  for (const locale of LOCALES) {
    test(`[${locale}] homepage renders the category grid`, async ({ page }) => {
      const response = await page.goto(`/${locale}`);

      expect(response?.status(), "homepage should not error").toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();

      // Category names come from the Categories sheet, not hardcoded markup.
      const categoryLinks = page.locator('a[href*="category="]');
      await expect(categoryLinks.first()).toBeVisible({ timeout: 20_000 });
      expect(await categoryLinks.count()).toBeGreaterThan(0);
    });
  }

  for (const locale of LOCALES) {
    test(`[${locale}] catalog cards link to detail pages`, async ({ page }) => {
      await page.goto(`/${locale}/catalog`);

      const cards = page.locator('a[href*="/catalog/"]');
      await expect(cards.first()).toBeVisible({ timeout: 20_000 });

      const firstHref = await cards.first().getAttribute("href");
      expect(firstHref).toMatch(new RegExp(`/${locale}/catalog/.+`));
    });
  }

  for (const locale of LOCALES) {
    test(`[${locale}] product detail shows a stock badge`, async ({ page }) => {
      const id = await findInStockProductId(page, locale);

      await page.goto(`/${locale}/catalog/${id}`);
      await expect(page.locator("main, body").first()).toBeVisible();

      // Poster-stamp badge: in stock / only X left / out of stock.
      const badge = page
        .locator("text=/IN STOCK|ONLY \\d+ LEFT|OUT OF STOCK/i")
        .or(page.locator("text=/متوفر|متبقي|نفدت/i"))
        .or(page.locator("text=/EN STOCK|PLUS QUE|RUPTURE/i"));

      await expect(badge.first()).toBeVisible({ timeout: 20_000 });
    });
  }

  test("Arabic locale sets dir=rtl on the html element", async ({ page }) => {
    await page.goto("/ar");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("Latin locales keep dir=ltr", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

    await page.goto("/fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("navigation between locales preserves the catalog route", async ({ page }) => {
    await page.goto("/en/catalog");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/ar/catalog");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.goto("/fr/catalog");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("a category filter narrows the catalog listing", async ({ page }) => {
    await page.goto("/en/catalog");
    const cards = page.locator('a[href*="/catalog/"]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    const unfiltered = await cards.count();

    const categoryHref = await page.locator('a[href*="category="]').first().getAttribute("href");
    test.skip(!categoryHref, "no categories seeded");

    await page.goto(categoryHref!);
    const filteredCards = page.locator('a[href*="/catalog/"]');
    await expect(filteredCards.first()).toBeVisible({ timeout: 20_000 });
    const filtered = await filteredCards.count();

    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThanOrEqual(unfiltered);
  });
});

test.describe("Add to cart", () => {
  test("adding a product increments the cart", async ({ page }) => {
    const id = await findInStockProductId(page);
    await page.goto(`/en/catalog/${id}`);

    expect(await readCartTotalQuantity(page)).toBe(0);

    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect.poll(() => readCartTotalQuantity(page), { timeout: 10_000 }).toBeGreaterThan(0);

    const cartLink = page.locator('a[aria-label="Cart"]');
    await expect(cartLink).toBeVisible();
    await expect(cartLink).toContainText(/\d/);
  });

  test("adding the same product twice merges into one line", async ({ page }) => {
    const id = await findInStockProductId(page);
    await page.goto(`/en/catalog/${id}`);

    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect.poll(() => readCartTotalQuantity(page), { timeout: 10_000 }).toBe(1);

    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect
      .poll(
        () => page.evaluate(() => JSON.parse(localStorage.getItem("egyrock_cart") || "[]").length),
        { timeout: 10_000 },
      )
      .toBe(1);
  });

  test("the cart page lists the added lines with a checkout link", async ({ page }) => {
    const id = await findInStockProductId(page);
    await page.goto(`/en/catalog/${id}`);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect.poll(() => readCartTotalQuantity(page), { timeout: 10_000 }).toBeGreaterThan(0);

    await page.goto("/en/cart");

    await expect(page.locator("body")).toContainText(/ITEM|ITEMS/i);
    await expect(page.getByRole("link", { name: /proceed to checkout/i })).toBeVisible();
  });

  test("the cart can be emptied", async ({ page }) => {
    const id = await findInStockProductId(page);
    await page.goto(`/en/catalog/${id}`);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect.poll(() => readCartTotalQuantity(page), { timeout: 10_000 }).toBeGreaterThan(0);

    await page.goto("/en/cart");
    await page.getByRole("button", { name: /clear cart/i }).click();

    await expect.poll(() => readCartTotalQuantity(page), { timeout: 10_000 }).toBe(0);
  });

  test("the empty cart shows a browse prompt", async ({ page }) => {
    await page.goto("/en/cart");

    await expect(page.getByRole("link", { name: /browse catalog/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /proceed to checkout/i })).toHaveCount(0);
  });

  /**
   * AGENTS.md rule 3: adding to cart must never decrement Google Sheets
   * stock -- that only happens on admin payment confirmation.
   */
  test("adding to cart fires no stock-mutating API calls", async ({ page }) => {
    const writes: string[] = [];
    page.on("request", (req) => {
      if (req.method() !== "GET" && /\/api\//.test(req.url())) writes.push(req.url());
    });

    const id = await findInStockProductId(page);
    await page.goto(`/en/catalog/${id}`);
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect.poll(() => readCartTotalQuantity(page), { timeout: 10_000 }).toBeGreaterThan(0);

    await page.goto("/en/cart");
    await page.waitForLoadState("networkidle");

    expect(writes, `unexpected write calls: ${writes.join(", ")}`).toEqual([]);
  });
});
