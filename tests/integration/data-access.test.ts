// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetStore, seedRows, dataRows, buildFakeSheetsModule } from "../helpers/fakeSheets";

/**
 * ARCHITECTURE.md §3 — Data Access Layer (DAL) pattern.
 *
 * Every DAL module is exercised against the in-memory Sheets fake so that row
 * parsing, validation and write-safety are verified without hitting the API.
 */
vi.mock("@/lib/data/sheetsClient", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/data/sheetsClient")>("@/lib/data/sheetsClient");
  return buildFakeSheetsModule(actual.TAB_HEADERS);
});

import {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  decrementProductStock,
} from "@/lib/data/products";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/data/categories";
import { getUserByEmail, createUser, updateUserRole } from "@/lib/data/users";
import {
  getHomepageImages,
  addHomepageImage,
  updateHomepageImage,
  deleteHomepageImage,
} from "@/lib/data/homepageImages";
import { getTranslations, getTranslationsMap, upsertTranslation } from "@/lib/data/translations";
import { getPages, getPageBySlug, createPage, updatePage, deletePage } from "@/lib/data/pages";
import type { Product } from "@/types";

function product(overrides: Partial<Product> = {}): Omit<Product, "created_at"> {
  return {
    id: "riff-tee",
    category_id: "t-shirts",
    name_en: "Riff Tee",
    name_ar: "تيشيرت",
    name_fr: "Tee",
    desc_en: "Heavyweight cotton",
    desc_ar: "قطن",
    desc_fr: "Coton",
    price: 250,
    quantity: 5,
    images: ["/images/placeholders/egyrock-1.jpeg"],
    sizes: [],
    ...overrides,
  };
}

/** A raw Products sheet row, values coerced to strings like the Sheets API does. */
function productRow(overrides: Record<number, unknown> = {}): unknown[] {
  const row: unknown[] = [
    "riff-tee",
    "t-shirts",
    "Riff Tee",
    "تيشيرت",
    "Tee",
    "Heavyweight cotton",
    "قطن",
    "Coton",
    250,
    5,
    '["/images/placeholders/egyrock-1.jpeg"]',
    "2026-01-01T00:00:00.000Z",
  ];
  for (const [index, value] of Object.entries(overrides)) {
    row[Number(index)] = value;
  }
  return row;
}

beforeEach(() => {
  resetStore();
});

describe("products DAL", () => {
  it("returns an empty list when the tab only has a header row", async () => {
    expect(await getProducts()).toEqual([]);
  });

  it("parses a raw sheet row into a typed Product", async () => {
    seedRows("Products", [productRow()]);

    const [p] = await getProducts();

    expect(p).toEqual({
      id: "riff-tee",
      category_id: "t-shirts",
      name_en: "Riff Tee",
      name_ar: "تيشيرت",
      name_fr: "Tee",
      desc_en: "Heavyweight cotton",
      desc_ar: "قطن",
      desc_fr: "Coton",
      price: 250,
      quantity: 5,
      images: ["/images/placeholders/egyrock-1.jpeg"],
      created_at: "2026-01-01T00:00:00.000Z",
      sizes: [],
    });
  });

  it("coerces numeric strings from Sheets into numbers", async () => {
    seedRows("Products", [productRow({ 8: "199.5", 9: "12" })]);

    const [p] = await getProducts();
    expect(p.price).toBe(199.5);
    expect(p.quantity).toBe(12);
  });

  it("accepts a comma-delimited images column as well as JSON", async () => {
    seedRows("Products", [productRow({ 10: "/a.jpeg, /b.jpeg" })]);

    const [p] = await getProducts();
    expect(p.images).toEqual(["/a.jpeg", "/b.jpeg"]);
  });

  it("never reports a negative quantity from a bad row", async () => {
    seedRows("Products", [productRow({ 9: "-4" })]);
    expect((await getProducts())[0].quantity).toBe(0);
  });

  it("skips rows with no id", async () => {
    seedRows("Products", [productRow(), productRow({ 0: "" })]);
    expect(await getProducts()).toHaveLength(1);
  });

  it("filters by category", async () => {
    seedRows("Products", [productRow(), productRow({ 0: "amp-mug", 1: "mugs" })]);

    expect((await getProductsByCategory("mugs")).map((p) => p.id)).toEqual(["amp-mug"]);
    expect(await getProductsByCategory("accessories")).toEqual([]);
  });

  it("creates a product and appends it to the sheet", async () => {
    const created = await createProduct(product({ id: "new-tee" }));

    expect(created.created_at).toBeTruthy();
    expect((await getProductById("new-tee"))?.name_en).toBe("Riff Tee");
    expect(dataRows("Products")).toHaveLength(1);
  });

  it("refuses to create a duplicate product id", async () => {
    seedRows("Products", [productRow()]);

    await expect(createProduct(product())).rejects.toThrow(/already exists/i);
    expect(dataRows("Products")).toHaveLength(1);
  });

  it("refuses to create a product missing required fields", async () => {
    await expect(createProduct(product({ name_en: "" }))).rejects.toThrow(/required product/i);
    await expect(createProduct(product({ category_id: "" }))).rejects.toThrow(/required product/i);
    expect(dataRows("Products")).toEqual([]);
  });

  it("clamps a negative price or quantity to zero on create", async () => {
    const created = await createProduct(product({ id: "bad", price: -50, quantity: -3 }));

    expect(created.price).toBe(0);
    expect(created.quantity).toBe(0);
  });

  it("updates editable fields and preserves id, images and created_at", async () => {
    seedRows("Products", [productRow()]);

    const updated = await updateProduct("riff-tee", {
      price: 300,
      quantity: 9,
      name_en: "Riff Tee v2",
    });

    expect(updated.id).toBe("riff-tee");
    expect(updated.price).toBe(300);
    expect(updated.quantity).toBe(9);
    expect(updated.name_en).toBe("Riff Tee v2");
    expect(updated.images).toEqual(["/images/placeholders/egyrock-1.jpeg"]);
    expect(updated.created_at).toBe("2026-01-01T00:00:00.000Z");
  });

  it("throws when updating or deleting an unknown product", async () => {
    await expect(updateProduct("ghost", { price: 1 })).rejects.toThrow(/not found/i);
    await expect(deleteProduct("ghost")).rejects.toThrow(/not found/i);
  });

  it("deletes a product row", async () => {
    seedRows("Products", [productRow(), productRow({ 0: "amp-mug" })]);

    await deleteProduct("riff-tee");

    expect((await getProducts()).map((p) => p.id)).toEqual(["amp-mug"]);
  });

  describe("decrementProductStock", () => {
    it("reduces the quantity and returns the new value", async () => {
      seedRows("Products", [productRow()]);

      expect(await decrementProductStock("riff-tee", 2)).toBe(3);
      expect((await getProductById("riff-tee"))?.quantity).toBe(3);
    });

    it("clamps at zero rather than going negative", async () => {
      seedRows("Products", [productRow({ 9: "2" })]);

      expect(await decrementProductStock("riff-tee", 10)).toBe(0);
      expect(dataRows("Products")[0][9]).toBe("0");
    });

    it("throws for an unknown product", async () => {
      await expect(decrementProductStock("ghost", 1)).rejects.toThrow(/not found/i);
    });
  });
});

describe("categories DAL", () => {
  const category = {
    id: "t-shirts",
    name_en: "T-shirts",
    name_ar: "تيشيرتات",
    name_fr: "T-shirts",
    parent_id: "",
  };

  it("parses category rows", async () => {
    seedRows("Categories", [["t-shirts", "T-shirts", "تيشيرتات", "T-shirts"]]);

    expect(await getCategories()).toEqual([category]);
    expect(await getCategoryById("t-shirts")).toEqual(category);
  });

  it("creates a category — admin can add new categories from the UI", async () => {
    await createCategory(category);

    expect(await getCategories()).toHaveLength(1);
  });

  it("refuses a duplicate category id", async () => {
    seedRows("Categories", [["t-shirts", "T-shirts", "تيشيرتات", "T-shirts"]]);

    await expect(createCategory(category)).rejects.toThrow(/already exists/i);
  });

  it("refuses a category missing id or English name", async () => {
    await expect(createCategory({ ...category, id: "" })).rejects.toThrow(/required category/i);
    await expect(createCategory({ ...category, name_en: "" })).rejects.toThrow(
      /required category/i,
    );
  });

  it("renames a category in all three locales without changing its id", async () => {
    seedRows("Categories", [["t-shirts", "T-shirts", "تيشيرتات", "T-shirts"]]);

    const updated = await updateCategory("t-shirts", {
      name_en: "Band Tees",
      name_ar: "تيشيرتات الباند",
      name_fr: "Tees de groupe",
    });

    expect(updated.id).toBe("t-shirts");
    expect(updated.name_en).toBe("Band Tees");
    expect((await getCategoryById("t-shirts"))?.name_ar).toBe("تيشيرتات الباند");
  });

  it("throws for unknown ids on update and delete", async () => {
    await expect(updateCategory("ghost", { name_en: "x" })).rejects.toThrow(/not found/i);
    await expect(deleteCategory("ghost")).rejects.toThrow(/not found/i);
  });

  it("deletes a category", async () => {
    seedRows("Categories", [
      ["t-shirts", "T-shirts", "تيشيرتات", "T-shirts"],
      ["mugs", "Mugs", "أكواب", "Mugs"],
    ]);

    await deleteCategory("t-shirts");

    expect((await getCategories()).map((c) => c.id)).toEqual(["mugs"]);
  });
});

describe("users DAL", () => {
  it("normalizes email casing and whitespace on create", async () => {
    const user = await createUser({
      email: "  Admin@EgyRock.COM ",
      password_hash: "hash",
      name: "Admin",
      role: "admin",
    });

    expect(user.email).toBe("admin@egyrock.com");
    expect(user.id).toMatch(/^USR-/);
    expect(user.created_at).toBeTruthy();
  });

  it("defaults to the customer role when none is supplied", async () => {
    const user = await createUser({
      email: "fan@egyrock.com",
      password_hash: "hash",
      name: "Fan",
      role: undefined as any,
    });

    expect(user.role).toBe("customer");
  });

  it("looks users up case-insensitively", async () => {
    await createUser({
      email: "fan@egyrock.com",
      password_hash: "hash",
      name: "Fan",
      role: "customer",
    });

    expect(await getUserByEmail("FAN@EGYROCK.COM")).not.toBeNull();
    expect(await getUserByEmail("  fan@egyrock.com  ")).not.toBeNull();
  });

  it("returns null for an unknown email", async () => {
    expect(await getUserByEmail("nobody@egyrock.com")).toBeNull();
  });

  it("rejects duplicate emails regardless of casing", async () => {
    await createUser({
      email: "fan@egyrock.com",
      password_hash: "hash",
      name: "Fan",
      role: "customer",
    });

    await expect(
      createUser({
        email: "FAN@egyrock.com",
        password_hash: "hash2",
        name: "Fan 2",
        role: "customer",
      }),
    ).rejects.toThrow(/already exists/i);
  });

  it("rejects a user missing email or password hash", async () => {
    await expect(
      createUser({ email: "", password_hash: "h", name: "x", role: "customer" }),
    ).rejects.toThrow(/required user/i);
    await expect(
      createUser({ email: "a@b.com", password_hash: "", name: "x", role: "customer" }),
    ).rejects.toThrow(/required user/i);
  });

  it("promotes a user to admin and back", async () => {
    const user = await createUser({
      email: "fan@egyrock.com",
      password_hash: "hash",
      name: "Fan",
      role: "customer",
    });

    expect((await updateUserRole(user.id, "admin")).role).toBe("admin");
    expect((await getUserByEmail("fan@egyrock.com"))?.role).toBe("admin");
  });

  it("throws when changing the role of an unknown user", async () => {
    await expect(updateUserRole("USR-GHOST", "admin")).rejects.toThrow(/not found/i);
  });
});

describe("homepageImages DAL — admin-editable hero slides", () => {
  const slideA = [
    "HERO-A",
    "/images/hero/1.jpeg",
    "https://egyrock.test/sale",
    "Title A",
    "عنوان أ",
    "1",
  ];
  const slideB = ["HERO-B", "/images/hero/2.jpeg", "", "Title B", "", "2"];

  it("returns slides ordered by sort_order, not sheet order", async () => {
    seedRows("HomepageImages", [slideB, slideA]);

    expect((await getHomepageImages()).map((s) => s.id)).toEqual(["HERO-A", "HERO-B"]);
  });

  it("skips rows without an id or image url", async () => {
    seedRows("HomepageImages", [
      slideA,
      ["", "", "", "", "", "3"],
      ["HERO-C", "", "", "", "", "4"],
    ]);

    expect((await getHomepageImages()).map((s) => s.id)).toEqual(["HERO-A"]);
  });

  it("generates an id when one is not supplied", async () => {
    const added = await addHomepageImage({
      image_url: "/images/hero/new.jpeg",
      sort_order: 3,
    });

    expect(added.id).toMatch(/^HERO-/);
    expect(await getHomepageImages()).toHaveLength(1);
  });

  it("updates the image url, link and heading of a slide", async () => {
    seedRows("HomepageImages", [slideA]);

    const updated = await updateHomepageImage("HERO-A", {
      image_url: "/images/hero/1-new.jpeg",
      link_url: "https://egyrock.test/new",
      title_en: "New Title",
    });

    expect(updated.id).toBe("HERO-A");
    expect(updated.image_url).toBe("/images/hero/1-new.jpeg");
    expect(updated.link_url).toBe("https://egyrock.test/new");
    expect(updated.title_en).toBe("New Title");
    expect(updated.title_ar).toBe("عنوان أ"); // untouched
  });

  it("reorders slides by changing sort_order", async () => {
    seedRows("HomepageImages", [slideA, slideB]);

    await updateHomepageImage("HERO-B", { sort_order: 0 });

    expect((await getHomepageImages()).map((s) => s.id)).toEqual(["HERO-B", "HERO-A"]);
  });

  it("deletes a slide", async () => {
    seedRows("HomepageImages", [slideA, slideB]);

    await deleteHomepageImage("HERO-A");

    expect((await getHomepageImages()).map((s) => s.id)).toEqual(["HERO-B"]);
  });

  it("throws for unknown ids", async () => {
    await expect(updateHomepageImage("HERO-GHOST", { sort_order: 1 })).rejects.toThrow(
      /not found/i,
    );
    await expect(deleteHomepageImage("HERO-GHOST")).rejects.toThrow(/not found/i);
  });
});

describe("translations DAL — admin-editable UI strings", () => {
  const rows = [
    ["common.add_to_cart", "Add to cart", "أضف إلى السلة", "Ajouter au panier"],
    ["common.partial", "Add", "", ""],
  ];

  it("returns an empty list when the tab only has a header row", async () => {
    expect(await getTranslations()).toEqual([]);
  });

  it("parses translation rows in all three locales", async () => {
    seedRows("Translations", rows);

    expect(await getTranslations()).toEqual([
      {
        key: "common.add_to_cart",
        en: "Add to cart",
        ar: "أضف إلى السلة",
        fr: "Ajouter au panier",
      },
      { key: "common.partial", en: "Add", ar: "", fr: "" },
    ]);
  });

  it("builds a lookup map for the requested locale", async () => {
    seedRows("Translations", rows);

    expect((await getTranslationsMap("ar"))["common.add_to_cart"]).toBe("أضف إلى السلة");
    expect((await getTranslationsMap("fr"))["common.add_to_cart"]).toBe("Ajouter au panier");
  });

  it("falls back to English when a locale is missing a string", async () => {
    seedRows("Translations", rows);

    expect((await getTranslationsMap("ar"))["common.partial"]).toBe("Add");
    expect((await getTranslationsMap("fr"))["common.partial"]).toBe("Add");
  });

  it("inserts a brand-new translation key", async () => {
    const record = await upsertTranslation("nav.catalog", {
      en: "Catalog",
      ar: "الكتالوج",
      fr: "Catalogue",
    });

    expect(record).toEqual({ key: "nav.catalog", en: "Catalog", ar: "الكتالوج", fr: "Catalogue" });
    expect(await getTranslations()).toHaveLength(1);
  });

  it("updates an existing key in place instead of duplicating it", async () => {
    seedRows("Translations", rows);

    const record = await upsertTranslation("common.add_to_cart", { ar: "اشتري الآن" });

    expect(record.ar).toBe("اشتري الآن");
    expect(await getTranslations()).toHaveLength(2);
  });

  it("preserves other locales when updating a single column", async () => {
    seedRows("Translations", rows);

    await upsertTranslation("common.add_to_cart", { fr: "Acheter" });

    const stored = (await getTranslations()).find((t) => t.key === "common.add_to_cart");
    expect(stored?.en).toBe("Add to cart");
    expect(stored?.ar).toBe("أضف إلى السلة");
    expect(stored?.fr).toBe("Acheter");
  });
});

describe("pages DAL — dynamic content pages", () => {
  const draftPage = {
    id: "about",
    slug: "about",
    title_en: "About",
    title_ar: "من نحن",
    title_fr: "À propos",
    content_en: "EgyRock is a Cairo-based underground store.",
    content_ar: "متجر مصري",
    content_fr: "Boutique du Caire",
    is_published: true,
    updated_at: "2026-01-01T00:00:00.000Z",
  };

  function pageRow(overrides: Partial<typeof draftPage> = {}): unknown[] {
    const p = { ...draftPage, ...overrides };
    return [
      p.id,
      p.slug,
      p.title_en,
      p.title_ar,
      p.title_fr,
      p.content_en,
      p.content_ar,
      p.content_fr,
      p.is_published ? "true" : "false",
      p.updated_at,
    ];
  }

  it("parses published pages including the boolean column", async () => {
    seedRows("Pages", [pageRow()]);

    expect(await getPages()).toEqual([draftPage]);
  });

  it("treats 'false' in the sheet as unpublished", async () => {
    seedRows("Pages", [pageRow({ is_published: false })]);

    expect((await getPages())[0].is_published).toBe(false);
  });

  it("looks a page up by slug for the storefront route", async () => {
    seedRows("Pages", [pageRow()]);

    expect((await getPageBySlug("about"))?.title_en).toBe("About");
    expect(await getPageBySlug("does-not-exist")).toBeNull();
  });

  it("hides unpublished pages from the storefront lookup", async () => {
    seedRows("Pages", [pageRow({ is_published: false })]);

    expect(await getPageBySlug("about")).toBeNull();
    expect(await getPages()).toHaveLength(1); // still visible in the admin list
  });

  it("creates a page in all three locales", async () => {
    const created = await createPage({
      slug: "faq",
      title_en: "FAQ",
      title_ar: "أسئلة",
      title_fr: "FAQ",
      content_en: "Answers",
      content_ar: "أجوبة",
      content_fr: "Réponses",
      is_published: true,
    });

    expect(created.id).toMatch(/^PAGE-/);
    expect(created.updated_at).toBeTruthy();
    expect(await getPageBySlug("faq")).not.toBeNull();
  });

  it("refuses to create a page over an existing id", async () => {
    seedRows("Pages", [pageRow()]);

    await expect(
      createPage({
        id: "about",
        slug: "about-us",
        title_en: "About Us",
        title_ar: "",
        title_fr: "",
        content_en: "",
        content_ar: "",
        content_fr: "",
        is_published: true,
      }),
    ).rejects.toThrow(/already exists/i);

    expect(await getPages()).toHaveLength(1);
  });

  it("refuses to create a page missing a slug or English title", async () => {
    await expect(
      createPage({
        slug: "",
        title_en: "x",
        title_ar: "",
        title_fr: "",
        content_en: "",
        content_ar: "",
        content_fr: "",
        is_published: true,
      }),
    ).rejects.toThrow(/required page fields/i);
  });

  it("updates content, re-stamps updated_at and keeps the slug stable", async () => {
    seedRows("Pages", [pageRow()]);

    const updated = await updatePage("about", {
      content_en: "Updated copy",
      is_published: false,
    });

    expect(updated.id).toBe("about");
    expect(updated.slug).toBe("about");
    expect(updated.content_en).toBe("Updated copy");
    expect(updated.content_ar).toBe("متجر مصري"); // untouched
    expect(updated.updated_at).not.toBe("2026-01-01T00:00:00.000Z");
  });

  it("deletes a page", async () => {
    seedRows("Pages", [pageRow(), pageRow({ id: "faq", slug: "faq" })]);

    await deletePage("about");

    expect((await getPages()).map((p) => p.id)).toEqual(["faq"]);
  });

  it("throws for unknown ids on update and delete", async () => {
    await expect(updatePage("ghost", { title_en: "x" })).rejects.toThrow(/not found/i);
    await expect(deletePage("ghost")).rejects.toThrow(/not found/i);
  });
});
