import { Category } from "@/types";
import { readTab, appendRow, updateRow, deleteRow } from "./sheetsClient";

const TAB = "Categories";

function rowToCategory(row: string[]): Category {
  return {
    id: row[0] || "",
    name_en: row[1] || "",
    name_ar: row[2] || "",
    name_fr: row[3] || "",
    parent_id: row[4] || "",
  };
}

function categoryToRow(c: Category): any[] {
  return [c.id, c.name_en, c.name_ar, c.name_fr, c.parent_id || ""];
}

export async function getCategories(): Promise<Category[]> {
  const rows = await readTab(TAB);
  if (rows.length <= 1) return [];

  return rows
    .slice(1)
    .map(rowToCategory)
    .filter((c) => Boolean(c.id));
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.id === id) || null;
}

export async function createCategory(cat: Category): Promise<Category> {
  if (!cat.id || !cat.name_en) {
    throw new Error("Missing required category fields (id, name_en)");
  }

  const existing = await getCategoryById(cat.id);
  if (existing) {
    throw new Error(`Category with ID "${cat.id}" already exists`);
  }

  await appendRow(TAB, categoryToRow(cat));
  return cat;
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, "id">>,
): Promise<Category> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Category with ID "${id}" not found`);
  }

  const current = rowToCategory(rows[rowIndex]);
  const updated: Category = {
    ...current,
    ...updates,
    id: current.id,
  };

  await updateRow(TAB, rowIndex + 1, categoryToRow(updated));
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Category with ID "${id}" not found`);
  }

  await deleteRow(TAB, rowIndex + 1);
}
