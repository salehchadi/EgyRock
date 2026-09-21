#!/usr/bin/env tsx
/**
 * One-time data cleanup for the live sheet after a double-seed:
 *  1. Remove duplicate auto-generated categories (CAT-*) — keep canonical
 *     `courses`, `tshirts`, `mugs`, `accessories`.
 *  2. Re-point products whose category_id is `t-shirts` (non-existent) to `tshirts`.
 *  3. Remove duplicate hero slide set (IMG-*) — keep hero-1/2/3.
 * Idempotent: safe to run multiple times.
 */
import { getCategories, deleteCategory } from "../src/lib/data/categories";
import { getProducts, updateProduct } from "../src/lib/data/products";
import { getHomepageImages, deleteHomepageImage } from "../src/lib/data/homepageImages";

const CANONICAL_IDS = new Set(["courses", "tshirts", "mugs", "accessories"]);

async function main() {
  // --- 1. Remove duplicate CAT-* categories ---
  const cats = await getCategories();
  const dupCats = cats.filter((c) => !CANONICAL_IDS.has(c.id));
  for (const c of dupCats) {
    await deleteCategory(c.id);
    console.log(`🗑  Deleted duplicate category: ${c.id} (${c.name_en})`);
  }
  if (dupCats.length === 0) console.log("✓ No duplicate categories");

  // --- 2. Fix product category_id references ---
  const prods = await getProducts();
  for (const p of prods) {
    let fixed: string | null = null;
    if (p.category_id === "t-shirts") fixed = "tshirts";
    else if (!CANONICAL_IDS.has(p.category_id)) {
      // Product points at a deleted/duplicate category — map by name heuristic
      const n = p.category_id.toLowerCase();
      if (n.includes("course")) fixed = "courses";
      else if (n.includes("shirt")) fixed = "tshirts";
      else if (n.includes("mug")) fixed = "mugs";
      else if (n.includes("access")) fixed = "accessories";
    }
    if (fixed) {
      await updateProduct(p.id, { category_id: fixed });
      console.log(`🔧 Re-pointed product ${p.id} (${p.name_en}): ${p.category_id} → ${fixed}`);
    }
  }
  if (
    !prods.some(
      (p) =>
        p.category_id !== "courses" &&
        p.category_id !== "tshirts" &&
        p.category_id !== "mugs" &&
        p.category_id !== "accessories",
    )
  ) {
    console.log("✓ All products point at canonical categories");
  }

  // --- 3. Remove duplicate IMG-* hero slides ---
  const hero = await getHomepageImages();
  const dupHero = hero.filter((h) => h.id.startsWith("IMG-"));
  for (const h of dupHero) {
    await deleteHomepageImage(h.id);
    console.log(`🗑  Deleted duplicate hero slide: ${h.id} (${h.title_en || "untitled"})`);
  }
  if (dupHero.length === 0) console.log("✓ No duplicate hero slides");

  // --- Final state ---
  const [finalCats, finalProds, finalHero] = await Promise.all([
    getCategories(),
    getProducts(),
    getHomepageImages(),
  ]);
  console.log("\n=== FINAL STATE ===");
  console.log(`Categories: ${finalCats.length} → ${finalCats.map((c) => c.id).join(", ")}`);
  console.log(
    `Products: ${finalProds.length} (all valid category refs: ${finalProds.every((p) => CANONICAL_IDS.has(p.category_id))})`,
  );
  console.log(`Hero slides: ${finalHero.length} → ${finalHero.map((h) => h.id).join(", ")}`);
}

main().catch((e) => {
  console.error("CLEANUP FAILED:", e.message);
  process.exit(1);
});
