/**
 * Data Access Layer for Homepage Images
 * All database operations for homepage images go through this module
 */

import { getSheetData, appendSheetData, updateSheetData, deleteSheetRow } from "./sheetsClient";
import type { HomepageImage } from "../types";

const SHEET_NAME = "HomepageImages";

/**
 * Convert row array to HomepageImage object
 */
function rowToHomepageImage(row: string[]): HomepageImage {
  return {
    id: row[0] || "",
    image_url: row[1] || "",
    link_url: row[2] || "",
    title_en: row[3] || "",
    title_ar: row[4] || "",
    sort_order: parseInt(row[5]) || 0,
  };
}

/**
 * Convert HomepageImage object to row array
 */
function homepageImageToRow(image: HomepageImage): string[] {
  return [
    image.id,
    image.image_url,
    image.link_url,
    image.title_en,
    image.title_ar,
    image.sort_order.toString(),
  ];
}

/**
 * Get all homepage images sorted by sort_order
 */
export async function getHomepageImages(): Promise<HomepageImage[]> {
  try {
    const rows = await getSheetData(SHEET_NAME, "A2:F1000");
    const images = rows.map((row) => rowToHomepageImage(row));
    return images.sort((a, b) => a.sort_order - b.sort_order);
  } catch (error) {
    console.error("Error fetching homepage images:", error);
    return [];
  }
}

/**
 * Get homepage image by ID
 */
export async function getHomepageImageById(id: string): Promise<HomepageImage | null> {
  try {
    const images = await getHomepageImages();
    return images.find((i) => i.id === id) || null;
  } catch (error) {
    console.error("Error fetching homepage image by ID:", error);
    return null;
  }
}

/**
 * Create a new homepage image
 */
export async function createHomepageImage(
  image: Omit<HomepageImage, "id">,
): Promise<HomepageImage> {
  try {
    const id = `IMG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newImage: HomepageImage = {
      ...image,
      id,
    };

    await appendSheetData(SHEET_NAME, "A1", [homepageImageToRow(newImage)]);
    return newImage;
  } catch (error) {
    console.error("Error creating homepage image:", error);
    throw new Error("Failed to create homepage image");
  }
}

/**
 * Update an existing homepage image
 */
export async function updateHomepageImage(
  id: string,
  updates: Partial<HomepageImage>,
): Promise<HomepageImage | null> {
  try {
    const images = await getHomepageImages();
    const index = images.findIndex((i) => i.id === id);

    if (index === -1) {
      return null;
    }

    const updatedImage = { ...images[index], ...updates };
    const rowIndex = index + 2; // +2 for header and 1-based indexing

    await updateSheetData(SHEET_NAME, `A${rowIndex}:F${rowIndex}`, [
      homepageImageToRow(updatedImage),
    ]);
    return updatedImage;
  } catch (error) {
    console.error("Error updating homepage image:", error);
    throw new Error("Failed to update homepage image");
  }
}

/**
 * Delete a homepage image
 */
export async function deleteHomepageImage(id: string): Promise<boolean> {
  try {
    const images = await getHomepageImages();
    const index = images.findIndex((i) => i.id === id);

    if (index === -1) {
      return false;
    }

    const rowIndex = index + 2; // +2 for header and 1-based indexing
    await deleteSheetRow(SHEET_NAME, rowIndex);
    return true;
  } catch (error) {
    console.error("Error deleting homepage image:", error);
    throw new Error("Failed to delete homepage image");
  }
}

/**
 * Update multiple homepage images at once (for reordering)
 */
export async function updateHomepageImages(images: HomepageImage[]): Promise<HomepageImage[]> {
  try {
    const updatedImages: HomepageImage[] = [];

    for (const image of images) {
      const updated = await updateHomepageImage(image.id, image);
      if (updated) {
        updatedImages.push(updated);
      }
    }

    return updatedImages;
  } catch (error) {
    console.error("Error updating homepage images:", error);
    throw new Error("Failed to update homepage images");
  }
}
