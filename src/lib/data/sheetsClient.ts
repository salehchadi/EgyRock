import { google } from "googleapis";
import fs from "fs";
import path from "path";

const LOCAL_DB_PATH = path.join(process.cwd(), ".data", "local-db.json");

export const TAB_HEADERS: Record<string, string[]> = {
  Products: [
    "id",
    "category_id",
    "name_en",
    "name_ar",
    "name_fr",
    "desc_en",
    "desc_ar",
    "desc_fr",
    "price",
    "quantity",
    "images",
    "created_at",
  ],
  Categories: ["id", "name_en", "name_ar", "name_fr"],
  Orders: [
    "id",
    "user_id",
    "customer_name",
    "customer_phone",
    "shipping_address",
    "items_json",
    "total",
    "status",
    "receipt_image_url",
    "created_at",
    "confirmed_at",
  ],
  Users: ["id", "email", "password_hash", "name", "role", "created_at"],
  HomepageImages: ["id", "image_url", "link_url", "title_en", "title_ar", "sort_order"],
  Translations: ["key", "en", "ar", "fr"],
  Pages: [
    "id",
    "slug",
    "title_en",
    "title_ar",
    "title_fr",
    "content_en",
    "content_ar",
    "content_fr",
    "is_published",
    "updated_at",
  ],
};

function isGoogleSheetsConfigured(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  return Boolean(
    email &&
    key &&
    sheetId &&
    !email.includes("your-service-account") &&
    !sheetId.includes("your_google_sheet"),
  );
}

function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
  const privateKey = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getLocalDb(): Record<string, any[][]> {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initial: Record<string, any[][]> = {};
    for (const [tab, headers] of Object.entries(TAB_HEADERS)) {
      initial[tab] = [headers];
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLocalDb(data: Record<string, any[][]>) {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

export async function readTab(tabName: string): Promise<string[][]> {
  if (isGoogleSheetsConfigured()) {
    try {
      const auth = getGoogleAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tabName}!A:Z`,
      });

      const rows = response.data.values || [];
      return rows.map((r) => r.map((c) => String(c ?? "")));
    } catch (err: any) {
      console.error(
        `[GoogleSheets DAL Error] Failed reading tab "${tabName}":`,
        err?.message || err,
      );
      throw new Error(`Failed to read from Google Sheets tab ${tabName}: ${err?.message}`);
    }
  }

  // Fallback to local persistent JSON store
  const db = getLocalDb();
  if (!db[tabName]) {
    db[tabName] = [TAB_HEADERS[tabName] || []];
    saveLocalDb(db);
  }
  return (db[tabName] || []).map((row) => row.map((c) => String(c ?? "")));
}

export async function appendRow(tabName: string, rowValues: any[]): Promise<void> {
  if (isGoogleSheetsConfigured()) {
    try {
      const auth = getGoogleAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tabName}!A:Z`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowValues.map((v) => (v === undefined || v === null ? "" : String(v)))],
        },
      });
      return;
    } catch (err: any) {
      console.error(
        `[GoogleSheets DAL Error] Failed appending to "${tabName}":`,
        err?.message || err,
      );
      throw new Error(`Failed to append to Google Sheets tab ${tabName}: ${err?.message}`);
    }
  }

  const db = getLocalDb();
  if (!db[tabName]) {
    db[tabName] = [TAB_HEADERS[tabName] || []];
  }
  db[tabName].push(rowValues.map((v) => (v === undefined || v === null ? "" : String(v))));
  saveLocalDb(db);
}

export async function updateRow(
  tabName: string,
  rowIndex: number,
  rowValues: any[],
): Promise<void> {
  // rowIndex is 1-indexed in Google Sheets terms (row 1 = header, row 2 = first data row)
  if (rowIndex < 2) {
    throw new Error("Cannot overwrite header row (index must be >= 2)");
  }

  if (isGoogleSheetsConfigured()) {
    try {
      const auth = getGoogleAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A${rowIndex}:Z${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowValues.map((v) => (v === undefined || v === null ? "" : String(v)))],
        },
      });
      return;
    } catch (err: any) {
      console.error(
        `[GoogleSheets DAL Error] Failed updating row ${rowIndex} in "${tabName}":`,
        err,
      );
      throw new Error(`Failed to update row in Google Sheets tab ${tabName}: ${err?.message}`);
    }
  }

  const db = getLocalDb();
  if (!db[tabName] || db[tabName].length < rowIndex) {
    throw new Error(`Row ${rowIndex} does not exist in ${tabName}`);
  }
  db[tabName][rowIndex - 1] = rowValues.map((v) =>
    v === undefined || v === null ? "" : String(v),
  );
  saveLocalDb(db);
}

export async function deleteRow(tabName: string, rowIndex: number): Promise<void> {
  if (rowIndex < 2) {
    throw new Error("Cannot delete header row");
  }

  if (isGoogleSheetsConfigured()) {
    try {
      const auth = getGoogleAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

      // Get sheet metadata to find sheetId
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheet = meta.data.sheets?.find((s) => s.properties?.title === tabName);
      if (!sheet || sheet.properties?.sheetId === undefined) {
        throw new Error(`Sheet tab ${tabName} not found`);
      }

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheet.properties.sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex,
                },
              },
            },
          ],
        },
      });
      return;
    } catch (err: any) {
      console.error(
        `[GoogleSheets DAL Error] Failed deleting row ${rowIndex} in "${tabName}":`,
        err,
      );
      throw new Error(`Failed to delete row in Google Sheets tab ${tabName}: ${err?.message}`);
    }
  }

  const db = getLocalDb();
  if (db[tabName] && db[tabName].length >= rowIndex) {
    db[tabName].splice(rowIndex - 1, 1);
    saveLocalDb(db);
  }
}
