/**
 * Data Access Layer for Categories
 * All database operations for categories go through this module
 */

import { getSheetData, appendSheetData, updateSheetData, deleteSheetRow } from "./sheetsClient";
import type { Category } from "../types";

const SHEET_NAME = "Categories";

/**
 * Convert row array to Category object
 */
function rowToCategory(row: string[]): Category {
  return {
    id: row[0] || "",
    name_en: row[1] || "",
    name_ar: row[2] || "",
    name_fr: row[3] || "",
  };
}

/**
 * Convert Category object to row array
 */
function categoryToRow(category: Category): string[] {
  return [category.id, category.name_en, category.name_ar, category.name_fr];
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const rows = await getSheetData(SHEET_NAME, "A2:D1000");
    return rows.map((row) => rowToCategory(row));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const categories = await getCategories();
    return categories.find((c) => c.id === id) || null;
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return null;
  }
}

/**
 * Create a new category
 */
export async function createCategory(category: Omit<Category, "id">): Promise<Category> {
  try {
    const id = `CAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newCategory: Category = {
      ...category,
      id,
    };

    await appendSheetData(SHEET_NAME, "A1", [categoryToRow(newCategory)]);
    return newCategory;
  } catch (error) {
    console.error("Error creating category:", error);
    throw new Error("Failed to create category");
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(
  id: string,
  updates: Partial<Category>,
): Promise<Category | null> {
  try {
    const categories = await getCategories();
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) {
      return null;
    }

    const updatedCategory = { ...categories[index], ...updates };
    const rowIndex = index + 2; // +2 for header and 1-based indexing

    await updateSheetData(SHEET_NAME, `A${rowIndex}:D${rowIndex}`, [
      categoryToRow(updatedCategory),
    ]);
    return updatedCategory;
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Failed to update category");
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const categories = await getCategories();
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) {
      return false;
    }

    const rowIndex = index + 2; // +2 for header and 1-based indexing
    await deleteSheetRow(SHEET_NAME, rowIndex);
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }
}
