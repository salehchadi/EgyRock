import { getCategories, updateCategory } from "../src/lib/data/categories";
import { getHomepageImages } from "../src/lib/data/homepageImages";

async function verifyHomepageDynamicData() {
  console.log("🎸 [EgyRock] Testing Homepage Live Data Reflection...");

  // 1. Check live hero images
  const slides = await getHomepageImages();
  console.log(`🖼️ Loaded ${slides.length} rotating hero images from database.`);
  if (slides.length < 3) {
    throw new Error(`Expected at least 3 hero images, got ${slides.length}`);
  }

  // 2. Check live categories
  const initialCategories = await getCategories();
  console.log("📦 Initial category names:", initialCategories.map((c) => c.name_en).join(", "));

  // 3. Update category name directly in database without code changes
  console.log("🔄 Updating category 'courses' name to 'Physical Masterclass Boxes'...");
  await updateCategory("courses", {
    name_en: "Physical Masterclass Boxes",
  });

  const updatedCategories = await getCategories();
  const updatedCourseCat = updatedCategories.find((c) => c.id === "courses");
  console.log("✨ Updated category name in DB:", updatedCourseCat?.name_en);

  if (updatedCourseCat?.name_en !== "Physical Masterclass Boxes") {
    throw new Error("Category update verification failed");
  }

  // Restore category name
  await updateCategory("courses", {
    name_en: "Physical Courses",
  });
  console.log("✅ Category name reverted cleanly to 'Physical Courses'.");
  console.log(
    "🎉 [EgyRock] Phase 6 verification confirmed: Database changes reflect directly without code changes!",
  );
}

verifyHomepageDynamicData().catch((err) => {
  console.error("❌ Homepage verification failed:", err);
  process.exit(1);
});
