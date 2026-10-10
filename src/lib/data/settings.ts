import { readTab, appendRow, updateRow } from "./sheetsClient";

const TAB = "Settings";

export interface StoreSettings {
  instapay_handle: string;
  instapay_link: string;
  instapay_phone: string;
  [key: string]: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  instapay_handle: process.env.NEXT_PUBLIC_INSTAPAY_HANDLE || "egyrock@instapay",
  instapay_link: "https://ipn.eg/egyrock",
  instapay_phone: "01000000000",
};

export async function getSettings(): Promise<StoreSettings> {
  const rows = await readTab(TAB);
  const settings: StoreSettings = { ...DEFAULT_SETTINGS };

  if (rows.length <= 1) return settings;

  for (const row of rows.slice(1)) {
    const key = (row[0] || "").trim();
    const value = row[1] || "";
    if (key) {
      settings[key] = value;
    }
  }

  return settings;
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const settings = await getSettings();
  return settings[key] !== undefined ? settings[key] : fallback;
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const rows = await readTab(TAB);
  const cleanKey = key.trim();
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0]?.trim() === cleanKey);

  if (rowIndex > -1) {
    await updateRow(TAB, rowIndex + 1, [cleanKey, value]);
  } else {
    await appendRow(TAB, [cleanKey, value]);
  }
}

export async function updateSettings(entries: Record<string, string>): Promise<StoreSettings> {
  for (const [k, v] of Object.entries(entries)) {
    await updateSetting(k, v);
  }
  return getSettings();
}
