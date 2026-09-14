import { TranslationRecord } from "@/types";
import { readTab, appendRow, updateRow } from "./sheetsClient";

const TAB = "Translations";

function rowToTranslation(row: string[]): TranslationRecord {
  return {
    key: row[0] || "",
    en: row[1] || "",
    ar: row[2] || "",
    fr: row[3] || "",
  };
}

function translationToRow(t: TranslationRecord): any[] {
  return [t.key, t.en, t.ar, t.fr];
}

export async function getTranslations(): Promise<TranslationRecord[]> {
  const rows = await readTab(TAB);
  if (rows.length <= 1) return [];

  return rows
    .slice(1)
    .map(rowToTranslation)
    .filter((t) => Boolean(t.key));
}

export async function getTranslationsMap(
  locale: "en" | "ar" | "fr",
): Promise<Record<string, string>> {
  const records = await getTranslations();
  const map: Record<string, string> = {};
  for (const rec of records) {
    map[rec.key] = rec[locale] || rec.en || "";
  }
  return map;
}

export async function upsertTranslation(
  key: string,
  values: { en?: string; ar?: string; fr?: string },
): Promise<TranslationRecord> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === key);

  if (rowIndex === -1) {
    const record: TranslationRecord = {
      key,
      en: values.en || "",
      ar: values.ar || "",
      fr: values.fr || "",
    };
    await appendRow(TAB, translationToRow(record));
    return record;
  }

  const current = rowToTranslation(rows[rowIndex]);
  const updated: TranslationRecord = {
    key: current.key,
    en: values.en !== undefined ? values.en : current.en,
    ar: values.ar !== undefined ? values.ar : current.ar,
    fr: values.fr !== undefined ? values.fr : current.fr,
  };

  await updateRow(TAB, rowIndex + 1, translationToRow(updated));
  return updated;
}
