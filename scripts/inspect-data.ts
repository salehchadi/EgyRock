#!/usr/bin/env tsx
/* Inspect live sheet data: categories, products, translations counts. */
import { getCategories } from "../src/lib/data/categories";
import { getProducts } from "../src/lib/data/products";
import { getTranslations } from "../src/lib/data/translations";
import { getHomepageImages } from "../src/lib/data/homepageImages";
import { getOrders } from "../src/lib/data/orders";

async function main() {
  const cats = await getCategories();
  console.log("CATEGORIES (%d):", cats.length);
  for (const c of cats) console.log(`  - ${c.id} | ${c.name_en} | ${c.name_ar} | ${c.name_fr}`);

  const prods = await getProducts();
  console.log("PRODUCTS (%d):", prods.length);
  for (const p of prods)
    console.log(
      `  - ${p.id} | cat=${p.category_id} | ${p.name_en} | qty=${p.quantity} | price=${p.price}`,
    );

  const trs = await getTranslations();
  console.log("TRANSLATION KEYS: %d", trs.length);

  const hero = await getHomepageImages();
  console.log("HERO IMAGES: %d", hero.length);
  for (const h of hero)
    console.log(`  - ${h.id} | sort=${h.sort_order} | ${h.title_en || "(no title)"}`);

  const orders = await getOrders();
  console.log("ORDERS: %d", orders.length);

  // Duplicate analysis
  const seen = new Map<string, number>();
  for (const c of cats) seen.set(c.id, (seen.get(c.id) || 0) + 1);
  const dups = [...seen.entries()].filter(([, n]) => n > 1);
  if (dups.length)
    console.log("DUPLICATE CATEGORY IDS:", dups.map(([id, n]) => `${id} x${n}`).join(", "));
  else console.log("NO DUPLICATE CATEGORY IDS");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
