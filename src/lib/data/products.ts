import { Product } from "@/types";
import { readTab, appendRow, updateRow, deleteRow } from "./sheetsClient";

const TAB = "Products";

function rowToProduct(row: string[]): Product {
  let images: string[] = [];
  try {
    if (row[10]) {
      images = row[10].startsWith("[")
        ? JSON.parse(row[10])
        : row[10].split(",").map((s) => s.trim());
    }
  } catch {
    images = [row[10] || ""];
  }

  let sizes: string[] = [];
  try {
    if (row[12]) {
      sizes = row[12].startsWith("[")
        ? JSON.parse(row[12])
        : row[12]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
  } catch {
    sizes = [];
  }

  return {
    id: row[0] || "",
    category_id: row[1] || "",
    name_en: row[2] || "",
    name_ar: row[3] || "",
    name_fr: row[4] || "",
    desc_en: row[5] || "",
    desc_ar: row[6] || "",
    desc_fr: row[7] || "",
    price: Number(row[8]) || 0,
    quantity: Math.max(0, parseInt(row[9], 10) || 0),
    images: images.filter(Boolean),
    created_at: row[11] || new Date().toISOString(),
    sizes,
  };
}

function productToRow(p: Product): any[] {
  return [
    p.id,
    p.category_id,
    p.name_en,
    p.name_ar,
    p.name_fr,
    p.desc_en,
    p.desc_ar,
    p.desc_fr,
    p.price,
    p.quantity,
    JSON.stringify(p.images),
    p.created_at,
    JSON.stringify(p.sizes || []),
  ];
}

export async function getProducts(): Promise<Product[]> {
  const rows = await readTab(TAB);
  if (rows.length <= 1) return [];

  // rows[0] is header row
  return rows
    .slice(1)
    .map(rowToProduct)
    .filter((p) => Boolean(p.id));
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.category_id === categoryId);
}

export async function createProduct(product: Omit<Product, "created_at">): Promise<Product> {
  if (!product.id || !product.name_en || !product.category_id) {
    throw new Error("Missing required product fields (id, name_en, category_id)");
  }

  const existing = await getProductById(product.id);
  if (existing) {
    throw new Error(`Product with ID ${product.id} already exists`);
  }

  const newProduct: Product = {
    ...product,
    price: Math.max(0, Number(product.price)),
    quantity: Math.max(0, Number(product.quantity)),
    created_at: new Date().toISOString(),
  };

  await appendRow(TAB, productToRow(newProduct));
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const rows = await readTab(TAB);
  if (rows.length <= 1) {
    throw new Error(`Product with ID ${id} not found`);
  }

  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Product with ID ${id} not found`);
  }

  const current = rowToProduct(rows[rowIndex]);
  const updated: Product = {
    ...current,
    ...updates,
    id: current.id, // ID cannot be changed
    price: updates.price !== undefined ? Math.max(0, Number(updates.price)) : current.price,
    quantity:
      updates.quantity !== undefined ? Math.max(0, Number(updates.quantity)) : current.quantity,
  };

  // rowIndex is 0-indexed in array; in Sheets terms row 1 = headers, so index + 1
  await updateRow(TAB, rowIndex + 1, productToRow(updated));
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Product with ID ${id} not found`);
  }

  await deleteRow(TAB, rowIndex + 1);
}

/**
 * Decrement stock quantity atomically.
 * RULE: Stock quantity is decremented ONLY when an admin confirms payment in admin panel.
 */
export async function decrementProductStock(id: string, count: number): Promise<number> {
  const product = await getProductById(id);
  if (!product) {
    throw new Error(`Cannot decrement stock: product ${id} not found`);
  }

  const newQuantity = Math.max(0, product.quantity - count);
  await updateProduct(id, { quantity: newQuantity });
  return newQuantity;
}
