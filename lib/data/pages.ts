/**
 * Data Access Layer for Pages
 * All database operations for pages go through this module
 */

import { getSheetData, appendSheetData, updateSheetData, deleteSheetRow } from "./sheetsClient";
import type { Page } from "../types";

const SHEET_NAME = "Pages";

/**
 * Convert row array to Page object
 */
function rowToPage(row: string[]): Page {
  return {
    id: row[0] || "",
    slug: row[1] || "",
    title_en: row[2] || "",
    title_ar: row[3] || "",
    title_fr: row[4] || "",
    content_en: row[5] || "",
    content_ar: row[6] || "",
    content_fr: row[7] || "",
    is_published: row[8] === "true" || row[8] === "TRUE",
    updated_at: row[9] || new Date().toISOString(),
  };
}

/**
 * Convert Page object to row array
 */
function pageToRow(page: Page): string[] {
  return [
    page.id,
    page.slug,
    page.title_en,
    page.title_ar,
    page.title_fr,
    page.content_en,
    page.content_ar,
    page.content_fr,
    page.is_published.toString(),
    page.updated_at,
  ];
}

/**
 * Get all pages
 */
export async function getPages(): Promise<Page[]> {
  try {
    const rows = await getSheetData(SHEET_NAME, "A2:J1000");
    return rows.map((row) => rowToPage(row));
  } catch (error) {
    console.error("Error fetching pages:", error);
    return [];
  }
}

/**
 * Get published pages only
 */
export async function getPublishedPages(): Promise<Page[]> {
  try {
    const pages = await getPages();
    return pages.filter((p) => p.is_published);
  } catch (error) {
    console.error("Error fetching published pages:", error);
    return [];
  }
}

/**
 * Get page by ID
 */
export async function getPageById(id: string): Promise<Page | null> {
  try {
    const pages = await getPages();
    return pages.find((p) => p.id === id) || null;
  } catch (error) {
    console.error("Error fetching page by ID:", error);
    return null;
  }
}

/**
 * Get page by slug
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const pages = await getPages();
    return pages.find((p) => p.slug === slug) || null;
  } catch (error) {
    console.error("Error fetching page by slug:", error);
    return null;
  }
}

/**
 * Create a new page
 */
export async function createPage(page: Omit<Page, "id" | "updated_at">): Promise<Page> {
  try {
    // Check if slug already exists
    const existingPage = await getPageBySlug(page.slug);
    if (existingPage) {
      throw new Error("Page with this slug already exists");
    }

    const id = `PAGE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newPage: Page = {
      ...page,
      id,
      updated_at: new Date().toISOString(),
    };

    await appendSheetData(SHEET_NAME, "A1", [pageToRow(newPage)]);
    return newPage;
  } catch (error) {
    console.error("Error creating page:", error);
    throw new Error("Failed to create page");
  }
}

/**
 * Update an existing page
 */
export async function updatePage(id: string, updates: Partial<Page>): Promise<Page | null> {
  try {
    const pages = await getPages();
    const index = pages.findIndex((p) => p.id === id);

    if (index === -1) {
      return null;
    }

    // If updating slug, check for duplicates
    if (updates.slug && updates.slug !== pages[index].slug) {
      const existingPage = await getPageBySlug(updates.slug);
      if (existingPage && existingPage.id !== id) {
        throw new Error("Page with this slug already exists");
      }
    }

    const updatedPage = {
      ...pages[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const rowIndex = index + 2; // +2 for header and 1-based indexing

    await updateSheetData(SHEET_NAME, `A${rowIndex}:J${rowIndex}`, [pageToRow(updatedPage)]);
    return updatedPage;
  } catch (error) {
    console.error("Error updating page:", error);
    throw new Error("Failed to update page");
  }
}

/**
 * Delete a page
 */
export async function deletePage(id: string): Promise<boolean> {
  try {
    const pages = await getPages();
    const index = pages.findIndex((p) => p.id === id);

    if (index === -1) {
      return false;
    }

    const rowIndex = index + 2; // +2 for header and 1-based indexing
    await deleteSheetRow(SHEET_NAME, rowIndex);
    return true;
  } catch (error) {
    console.error("Error deleting page:", error);
    throw new Error("Failed to delete page");
  }
}
