import { HomepageImage } from "@/types";
import { readTab, appendRow, updateRow, deleteRow } from "./sheetsClient";

const TAB = "HomepageImages";

function rowToImage(row: string[]): HomepageImage {
  return {
    id: row[0] || "",
    image_url: row[1] || "",
    link_url: row[2] || undefined,
    title_en: row[3] || undefined,
    title_ar: row[4] || undefined,
    sort_order: parseInt(row[5], 10) || 1,
  };
}

function imageToRow(img: HomepageImage): any[] {
  return [
    img.id,
    img.image_url,
    img.link_url || "",
    img.title_en || "",
    img.title_ar || "",
    img.sort_order,
  ];
}

export async function getHomepageImages(): Promise<HomepageImage[]> {
  const rows = await readTab(TAB);
  if (rows.length <= 1) return [];

  return rows
    .slice(1)
    .map(rowToImage)
    .filter((img) => Boolean(img.id) && Boolean(img.image_url))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function addHomepageImage(
  img: Omit<HomepageImage, "id"> & { id?: string },
): Promise<HomepageImage> {
  const id = img.id || `HERO-${Date.now().toString(36).toUpperCase()}`;
  const newSlide: HomepageImage = {
    ...img,
    id,
  };

  await appendRow(TAB, imageToRow(newSlide));
  return newSlide;
}

export async function updateHomepageImage(
  id: string,
  updates: Partial<HomepageImage>,
): Promise<HomepageImage> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Homepage image ${id} not found`);
  }

  const current = rowToImage(rows[rowIndex]);
  const updated: HomepageImage = {
    ...current,
    ...updates,
    id: current.id,
  };

  await updateRow(TAB, rowIndex + 1, imageToRow(updated));
  return updated;
}

export async function deleteHomepageImage(id: string): Promise<void> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Homepage image ${id} not found`);
  }

  await deleteRow(TAB, rowIndex + 1);
}
