/**
 * Data Access Layer for Products
 * All database operations for products go through this module
 */

import { getSheetData, appendSheetData, updateSheetData, deleteSheetRow } from "./sheetsClient";
import type { Product } from "../types";

const SHEET_NAME = "Products";

/**
 * Convert row array to Product object
 */
function rowToProduct(row: string[], index: number): Product {
  // Parse images field - handle both comma-separated strings and JSON arrays
  let images: string[] = [];
  try {
    const imagesData = row[10] || "";
    if (imagesData) {
      // Try parsing as JSON first
      if (imagesData.startsWith("[")) {
        const parsed = JSON.parse(imagesData);
        images = Array.isArray(parsed) ? parsed : [];
      } else {
        // Fallback to comma-separated
        images = imagesData
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
  } catch {
    // If parsing fails, use empty array
    images = [];
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
    price: parseFloat(row[8]) || 0,
    quantity: parseInt(row[9]) || 0,
    images,
    created_at: row[11] || new Date().toISOString(),
  };
}

/**
 * Convert Product object to row array
 */
function productToRow(product: Product): string[] {
  // Serialize images array to JSON string for storage
  const imagesData = JSON.stringify(product.images || []);

  return [
    product.id,
    product.category_id,
    product.name_en,
    product.name_ar,
    product.name_fr,
    product.desc_en,
    product.desc_ar,
    product.desc_fr,
    product.price.toString(),
    product.quantity.toString(),
    imagesData,
    product.created_at,
  ];
}

/**
 * Get all products
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const rows = await getSheetData(SHEET_NAME, "A2:L1000");
    return rows.map((row, index) => rowToProduct(row, index + 2));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const products = await getProducts();
    return products.find((p) => p.id === id) || null;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

/**
 * Get products by category ID
 */
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const products = await getProducts();
    return products.filter((p) => p.category_id === categoryId);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
}

/**
 * Create a new product
 */
export async function createProduct(product: Omit<Product, "id" | "created_at">): Promise<Product> {
  try {
    const id = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newProduct: Product = {
      ...product,
      id,
      created_at: new Date().toISOString(),
    };

    await appendSheetData(SHEET_NAME, "A1", [productToRow(newProduct)]);
    return newProduct;
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error("Failed to create product");
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  updates: Partial<Product>,
): Promise<Product | null> {
  try {
    const products = await getProducts();
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      return null;
    }

    const updatedProduct = { ...products[index], ...updates };
    const rowIndex = index + 2; // +2 for header and 1-based indexing

    await updateSheetData(SHEET_NAME, `A${rowIndex}:L${rowIndex}`, [productToRow(updatedProduct)]);
    return updatedProduct;
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error("Failed to update product");
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const products = await getProducts();
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      return false;
    }

    const rowIndex = index + 2; // +2 for header and 1-based indexing
    await deleteSheetRow(SHEET_NAME, rowIndex);
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product");
  }
}

/**
 * Decrement product stock quantity
 * This is the ONLY function that should modify stock quantity
 */
export async function decrementProductStock(id: string, quantity: number): Promise<Product | null> {
  try {
    const product = await getProductById(id);

    if (!product) {
      return null;
    }

    if (product.quantity < quantity) {
      throw new Error("Insufficient stock");
    }

    const updatedProduct = await updateProduct(id, {
      quantity: product.quantity - quantity,
    });

    return updatedProduct;
  } catch (error) {
    console.error("Error decrementing product stock:", error);
    throw new Error("Failed to decrement product stock");
  }
}
