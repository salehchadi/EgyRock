import { CustomPage } from "@/types";
import { readTab, appendRow, updateRow, deleteRow } from "./sheetsClient";

const TAB = "Pages";

function rowToPage(row: string[]): CustomPage {
  return {
    id: row[0] || "",
    slug: row[1] || "",
    title_en: row[2] || "",
    title_ar: row[3] || "",
    title_fr: row[4] || "",
    content_en: row[5] || "",
    content_ar: row[6] || "",
    content_fr: row[7] || "",
    is_published: row[8] === "true" || row[8] === "1",
    updated_at: row[9] || new Date().toISOString(),
  };
}

function pageToRow(p: CustomPage): any[] {
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

export async function getPages(): Promise<CustomPage[]> {
  const rows = await readTab(TAB);
  if (rows.length <= 1) return [];

  return rows
    .slice(1)
    .map(rowToPage)
    .filter((p) => Boolean(p.id) && Boolean(p.slug));
}

export async function getPageBySlug(slug: string): Promise<CustomPage | null> {
  const pages = await getPages();
  return pages.find((p) => p.slug === slug && p.is_published) || null;
}

export async function getPageById(id: string): Promise<CustomPage | null> {
  const pages = await getPages();
  return pages.find((p) => p.id === id) || null;
}

export async function createPage(
  data: Omit<CustomPage, "id" | "updated_at"> & { id?: string },
): Promise<CustomPage> {
  if (!data.slug || !data.title_en) {
    throw new Error("Missing required page fields (slug, title_en)");
  }

  const pages = await getPages();

  // The slug is the public route, so it must stay unique — otherwise
  // getPageBySlug() would always resolve to the older row.
  if (pages.some((p) => p.slug === data.slug)) {
    throw new Error(`Page with slug "${data.slug}" already exists`);
  }

  const id = data.id || `PAGE-${Date.now().toString(36).toUpperCase()}`;

  // A duplicate id would make updatePage()/deletePage() hit the wrong row.
  if (pages.some((p) => p.id === id)) {
    throw new Error(`Page with ID "${id}" already exists`);
  }

  const newPage: CustomPage = {
    ...data,
    id,
    updated_at: new Date().toISOString(),
  };

  await appendRow(TAB, pageToRow(newPage));
  return newPage;
}

export async function updatePage(id: string, updates: Partial<CustomPage>): Promise<CustomPage> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Page with ID "${id}" not found`);
  }

  const current = rowToPage(rows[rowIndex]);
  const updated: CustomPage = {
    ...current,
    ...updates,
    id: current.id,
    updated_at: new Date().toISOString(),
  };

  await updateRow(TAB, rowIndex + 1, pageToRow(updated));
  return updated;
}

export async function deletePage(id: string): Promise<void> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Page with ID "${id}" not found`);
  }

  await deleteRow(TAB, rowIndex + 1);
}
