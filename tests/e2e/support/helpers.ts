import { expect, type Page } from "@playwright/test";

export const LOCALES = ["en", "ar", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@egyrock.com";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";

/** Signs in through the localized credentials form and lands on the callback URL. */
export async function signIn(
  page: Page,
  email: string,
  password: string,
  locale: Locale = "en",
  callbackPath = `/${locale}/account`,
) {
  await page.goto(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in|دخول|connexion/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 30_000 });
}

export async function signInAsAdmin(page: Page, locale: Locale = "en") {
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD, locale, `/${locale}/admin`);
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin`));
}

/** Reads the live cart count out of localStorage (the source of truth for the cart). */
export async function readCart(page: Page): Promise<Array<{ id: string; quantity: number }>> {
  return page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("egyrock_cart") || "[]");
    return raw.map((line: any) => ({
      id: line.product?.id,
      quantity: line.quantity,
    }));
  });
}

export async function readCartTotalQuantity(page: Page): Promise<number> {
  const cart = await readCart(page);
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

export async function clearCart(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("egyrock_cart");
    window.dispatchEvent(new Event("cart-updated"));
  });
}

/**
 * Picks the first purchasable (in-stock) product from the catalog and returns
 * its id, so the flows do not depend on seed data being in a specific state.
 */
export async function findInStockProductId(page: Page, locale: Locale = "en"): Promise<string> {
  await page.goto(`/${locale}/catalog`);

  const productLinks = page.locator('a[href*="/catalog/"]');
  const count = await productLinks.count();

  for (let i = 0; i < count; i++) {
    const href = await productLinks.nth(i).getAttribute("href");
    if (!href) continue;
    const id = href.split("/catalog/")[1]?.split(/[?#]/)[0];
    if (!id) continue;

    const card = productLinks.nth(i).locator("xpath=ancestor-or-self::*[self::a or self::div][1]");
    const cardText =
      (await card
        .first()
        .innerText()
        .catch(() => "")) || "";
    if (/out of stock|نفدت|rupture/i.test(cardText)) continue;

    return id;
  }

  throw new Error(
    "No in-stock product found in the catalog. Seed the Products sheet with at least one item whose quantity > 0.",
  );
}

/** Creates a tiny valid PNG receipt on the fly for the checkout upload step. */
export const RECEIPT_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAHElEQVR42u3OMQEAAAgDoJnc/9CtwR0l" +
  "QAAAAAAAAAAAAPwZ5QAB0m1eWQAAAABJRU5ErkJggg==";
