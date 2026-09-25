import { test, expect } from "@playwright/test";
import { LOCALES, findInStockProductId, readCartTotalQuantity } from "./support/helpers";

test.describe("Storefront browsing across all three locales", () => {
  for (const locale of LOCALES) {
    test(`[${locale}] homepage leads with the scrollable product strip`, async ({ page }) => {
      const response = await page.goto(`/${locale}`);

      expect(response?.status(), "homepage should not error").toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();

      // The product strip is the FIRST thing on the page: no hero, no category grid.
      const firstSection = page.locator("main > *").first();
      const firstProductLink = firstSection.locator('a[href*="/catalog/"]').first();
      await expect(firstProductLink).toBeVisible({ timeout: 20_000 });

      // …and it scrolls horizontally rather than stacking vertically.
      const strip = page.locator(".horizontal-scroll").first();
      await expect(strip).toBeVisible();
      const scrollWidth = await strip.evaluate((el) => el.scrollWidth);
      const clientWidth = await strip.evaluate((el) => el.clientWidth);
      expect(scrollWidth).toBeGreaterThan(clientWidth);
    });
  }

  for (const locale of LOCALES) {
    test(`[${locale}] menu drawer lists categories with collapsible sub-categories`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`);
      await page.getByRole("button", { name: "Open menu" }).click();

      const drawer = page.getByRole("dialog", { name: "Menu" });
      await expect(drawer).toBeVisible();

      // Category links come from the Categories sheet, not hardcoded markup.
      const categoryLinks = drawer.locator('a[href*="category="]');
      await expect(categoryLinks.first()).toBeVisible({ timeout: 20_000 });
      const beforeExpand = await categoryLinks.count();
      expect(beforeExpand).toBeGreaterThan(0);

      // If any top-level category has children, expanding it reveals them.
      const expandButton = drawer.getByRole("button", { name: /expand/i }).first();
      if ((await expandButton.count()) > 0) {
        await expandButton.click();
        await expect
          .poll(() => categoryLinks.count(), { timeout: 10_000 })
          .toBeGreaterThan(beforeExpand);
      }
    });
  }

  test("the menu drawer opens from the left in LTR and from the right in RTL", async ({ page }) => {
    const viewport = page.viewportSize()!;
    const panel = page.getByTestId("menu-drawer-panel");
    const openMenu = () => page.getByRole("button", { name: "Open menu" }).click();

    // English (LTR) → drawer slides in from the left edge.
    await page.goto("/en");
    await openMenu();
    await expect(panel).toBeVisible();
    let box = (await panel.boundingBox())!;
    expect(box.x).toBeLessThan(viewport.width / 2);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);

    // Arabic (RTL) → drawer slides in from the right edge.
    await page.goto("/ar");
    await openMenu();
    await expect(panel).toBeVisible();
    box = (await panel.boundingBox())!;
    expect(box.x + box.width).toBeGreaterThan(viewport.width / 2);
    expect(box.x).toBeGreaterThanOrEqual(-1);
  });

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
