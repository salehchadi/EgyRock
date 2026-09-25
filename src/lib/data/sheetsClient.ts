import { google } from "googleapis";
import fs from "fs";
import path from "path";
import os from "os";
import initialData from "./initialData.json";

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
    "sizes",
  ],
  Categories: ["id", "name_en", "name_ar", "name_fr", "parent_id"],
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
    "coupon_code",
    "discount",
  ],
  Users: [
    "id",
    "email",
    "password_hash",
    "name",
    "role",
    "created_at",
    "phone",
    "address",
    "gender",
    "age",
  ],
  Coupons: [
    "id",
    "code",
    "type",
    "value",
    "min_order",
    "active",
    "usage_limit",
    "used_count",
    "expires_at",
    "created_at",
  ],
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
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
  // Strip wrapping quotes often added in cloud environment variables
  if (
    (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
    (rawKey.startsWith("'") && rawKey.endsWith("'"))
  ) {
    rawKey = rawKey.slice(1, -1);
  }
  const privateKey = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

let inMemoryDb: Record<string, any[][]> | null = null;

function getDbFilePath(): string {
  // If running in Vercel / serverless environment with read-only root, use /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "egyrock-local-db.json");
  }
  return path.join(process.cwd(), ".data", "local-db.json");
}

function getLocalDb(): Record<string, any[][]> {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  const filePath = getDbFilePath();

  // 1. Try reading from designated storage file
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      inMemoryDb = JSON.parse(raw);
      return inMemoryDb!;
    }
  } catch (err) {
    console.warn("[DAL] Could not read local db file, falling back to initial data:", err);
  }

  // 2. Try reading from repo .data/local-db.json if different
  try {
    const repoLocalPath = path.join(process.cwd(), ".data", "local-db.json");
    if (repoLocalPath !== filePath && fs.existsSync(repoLocalPath)) {
      const raw = fs.readFileSync(repoLocalPath, "utf8");
      inMemoryDb = JSON.parse(raw);
      return inMemoryDb!;
    }
  } catch {}

  // 3. Fallback to bundled initialData
  inMemoryDb = JSON.parse(JSON.stringify(initialData)) as Record<string, any[][]>;
  return inMemoryDb;
}

function saveLocalDb(data: Record<string, any[][]>) {
  inMemoryDb = data;
  try {
    const filePath = getDbFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err: any) {
    // In strict read-only environments, keep state in memory without throwing
    console.warn("[DAL] Notice: Disk write skipped (in-memory state preserved):", err?.message);
  }
}

/**
 * Keeps a stored tab aligned with the current `TAB_HEADERS` schema.
 *
 * Local dev databases created before a column was introduced (e.g. `sizes` on
 * Products, `parent_id` on Categories, `coupon_code`/`discount` on Orders) would
 * otherwise shift values into the wrong columns. Existing rows are re-mapped by
 * header name onto the expected order, and missing columns become empty strings.
 * Row count and order are never changed, so 1-based sheet row indices stay valid.
 */
function reconcileHeaders(tabName: string, db: Record<string, any[][]>): any[][] {
  const expected = TAB_HEADERS[tabName] || [];
  const rows = db[tabName] || [];
  if (expected.length === 0 || rows.length === 0) return rows;

  const current = rows[0] || [];
  const alreadyAligned =
    current.length === expected.length && expected.every((h, i) => current[i] === h);
  if (alreadyAligned) return rows;

  const migrated: any[][] = [
    expected.slice(),
    ...rows.slice(1).map((row) =>
      expected.map((header) => {
        const at = current.indexOf(header);
        return at === -1 ? "" : (row[at] ?? "");
      }),
    ),
  ];

  db[tabName] = migrated;
  saveLocalDb(db);
  console.info(`[DAL] Migrated fallback tab "${tabName}" to the current column schema.`);
  return migrated;
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
      if (rows.length > 0) {
        return rows.map((r) => r.map((c) => String(c ?? "")));
      }
    } catch (err: any) {
      console.error(
        `[GoogleSheets DAL Error] Failed reading tab "${tabName}":`,
        err?.message || err,
      );
      console.warn(
        `[GoogleSheets DAL Fallback] Serving tab "${tabName}" from bundled fallback store.`,
      );
    }
  }

  // Fallback to local persistent JSON / in-memory store
  const db = getLocalDb();
  if (!db[tabName] || db[tabName].length === 0) {
    db[tabName] = [TAB_HEADERS[tabName] || []];
    saveLocalDb(db);
  }
  const rows = reconcileHeaders(tabName, db);
  return (rows || []).map((row) => row.map((c) => String(c ?? "")));
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

      // Keep local store in sync
      const db = getLocalDb();
      if (!db[tabName]) {
        db[tabName] = [TAB_HEADERS[tabName] || []];
      }
      db[tabName].push(rowValues.map((v) => (v === undefined || v === null ? "" : String(v))));
      saveLocalDb(db);
      return;
    } catch (err: any) {
      console.error(
        `[GoogleSheets DAL Error] Failed appending to "${tabName}":`,
        err?.message || err,
      );
      // Update local store as resilient fallback
      const db = getLocalDb();
      if (!db[tabName]) {
        db[tabName] = [TAB_HEADERS[tabName] || []];
      }
      db[tabName].push(rowValues.map((v) => (v === undefined || v === null ? "" : String(v))));
      saveLocalDb(db);
      return;
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

      const db = getLocalDb();
      if (db[tabName] && db[tabName].length >= rowIndex) {
        db[tabName][rowIndex - 1] = rowValues.map((v) =>
          v === undefined || v === null ? "" : String(v),
        );
        saveLocalDb(db);
      }
      return;
    } catch (err: any) {
      console.error(
        `[GoogleSheets DAL Error] Failed updating row ${rowIndex} in "${tabName}":`,
        err?.message || err,
      );
      const db = getLocalDb();
      if (db[tabName] && db[tabName].length >= rowIndex) {
        db[tabName][rowIndex - 1] = rowValues.map((v) =>
          v === undefined || v === null ? "" : String(v),
        );
        saveLocalDb(db);
      }
      return;
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

      const db = getLocalDb();
      if (db[tabName] && db[tabName].length >= rowIndex) {
        db[tabName].splice(rowIndex - 1, 1);
        saveLocalDb(db);
      }
      return;
    } catch (err: any) {
      console.error(
        `[GoogleSheets DAL Error] Failed deleting row ${rowIndex} in "${tabName}":`,
        err?.message || err,
      );
      const db = getLocalDb();
      if (db[tabName] && db[tabName].length >= rowIndex) {
        db[tabName].splice(rowIndex - 1, 1);
        saveLocalDb(db);
      }
      return;
    }
  }

  const db = getLocalDb();
  if (db[tabName] && db[tabName].length >= rowIndex) {
    db[tabName].splice(rowIndex - 1, 1);
    saveLocalDb(db);
  }
}
