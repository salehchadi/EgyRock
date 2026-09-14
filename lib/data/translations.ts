/**
 * Data Access Layer for Translations
 * All database operations for translations go through this module
 */

import { getSheetData, appendSheetData, updateSheetData, deleteSheetRow } from "./sheetsClient";
import type { Translation } from "../types";

const SHEET_NAME = "Translations";

/**
 * Convert row array to Translation object
 */
function rowToTranslation(row: string[]): Translation {
  return {
    key: row[0] || "",
    en: row[1] || "",
    ar: row[2] || "",
    fr: row[3] || "",
  };
}

/**
 * Convert Translation object to row array
 */
function translationToRow(translation: Translation): string[] {
  return [translation.key, translation.en, translation.ar, translation.fr];
}

/**
 * Get all translations
 */
export async function getTranslations(): Promise<Translation[]> {
  try {
    const rows = await getSheetData(SHEET_NAME, "A2:D1000");
    return rows.map((row) => rowToTranslation(row));
  } catch (error) {
    console.error("Error fetching translations:", error);
    return [];
  }
}

/**
 * Get translation by key
 */
export async function getTranslationByKey(key: string): Promise<Translation | null> {
  try {
    const translations = await getTranslations();
    return translations.find((t) => t.key === key) || null;
  } catch (error) {
    console.error("Error fetching translation by key:", error);
    return null;
  }
}

/**
 * Get translations for a specific locale
 */
export async function getTranslationsByLocale(
  locale: "en" | "ar" | "fr",
): Promise<Record<string, string>> {
  try {
    const translations = await getTranslations();
    const result: Record<string, string> = {};

    for (const translation of translations) {
      result[translation.key] = translation[locale];
    }

    return result;
  } catch (error) {
    console.error("Error fetching translations by locale:", error);
    return {};
  }
}

/**
 * Create a new translation
 */
export async function createTranslation(
  translation: Omit<Translation, "key">,
  key?: string,
): Promise<Translation> {
  try {
    const translationKey = key || `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTranslation: Translation = {
      ...translation,
      key: translationKey,
    };

    await appendSheetData(SHEET_NAME, "A1", [translationToRow(newTranslation)]);
    return newTranslation;
  } catch (error) {
    console.error("Error creating translation:", error);
    throw new Error("Failed to create translation");
  }
}

/**
 * Update an existing translation
 */
export async function updateTranslation(
  key: string,
  values: Partial<Pick<Translation, "en" | "ar" | "fr">>,
): Promise<Translation | null> {
  try {
    const translations = await getTranslations();
    const index = translations.findIndex((t) => t.key === key);

    if (index === -1) {
      return null;
    }

    const updatedTranslation = { ...translations[index], ...values };
    const rowIndex = index + 2; // +2 for header and 1-based indexing

    await updateSheetData(SHEET_NAME, `A${rowIndex}:D${rowIndex}`, [
      translationToRow(updatedTranslation),
    ]);
    return updatedTranslation;
  } catch (error) {
    console.error("Error updating translation:", error);
    throw new Error("Failed to update translation");
  }
}

/**
 * Delete a translation
 */
export async function deleteTranslation(key: string): Promise<boolean> {
  try {
    const translations = await getTranslations();
    const index = translations.findIndex((t) => t.key === key);

    if (index === -1) {
      return false;
    }

    const rowIndex = index + 2; // +2 for header and 1-based indexing
    await deleteSheetRow(SHEET_NAME, rowIndex);
    return true;
  } catch (error) {
    console.error("Error deleting translation:", error);
    throw new Error("Failed to delete translation");
  }
}
