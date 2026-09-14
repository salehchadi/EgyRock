import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Google Sheets client singleton with rate-limiting and retry wrappers
let sheetsClient: any = null;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests to avoid rate limiting

const LOCAL_DB_PATH = path.join(process.cwd(), ".data", "local-db.json");

function isLiveSheetsConfigured(): boolean {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  return Boolean(
    sheetId &&
    email &&
    !sheetId.includes("your_google_sheet") &&
    !email.includes("your-service-account"),
  );
}

function getLocalData(sheetName: string): any[][] {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf8"));
      return data[sheetName] || [];
    }
  } catch (err) {
    console.warn(`[LocalStore] Could not read local db:`, err);
  }
  return [];
}

function saveLocalData(sheetName: string, rows: any[][]): void {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let data: Record<string, any[][]> = {};
    if (fs.existsSync(LOCAL_DB_PATH)) {
      data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf8"));
    }
    data[sheetName] = rows;
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`[LocalStore] Failed saving tab "${sheetName}":`, err);
  }
}

/**
 * Get or create the authenticated Google Sheets client
 * Uses environment variables for service account authentication
 */
export function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

/**
 * Rate-limited wrapper for Google Sheets API calls
 */
async function rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest),
    );
  }

  lastRequestTime = Date.now();
  return requestFn();
}

/**
 * Get data from a sheet tab
 */
export async function getSheetData(sheetName: string, range: string): Promise<any[][]> {
  if (!isLiveSheetsConfigured()) {
    return getLocalData(sheetName);
  }

  try {
    const client = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = (await rateLimitedRequest(() =>
      client.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!${range}`,
      }),
    )) as { data: { values?: any[][] } };

    return response.data.values || [];
  } catch (error) {
    console.error(`Error reading from sheet ${sheetName}:`, error);
    throw new Error(
      `Failed to read from Google Sheets: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Append data to a sheet tab
 */
export async function appendSheetData(
  sheetName: string,
  range: string,
  values: any[][],
): Promise<any> {
  if (!isLiveSheetsConfigured()) {
    const existing = getLocalData(sheetName);
    existing.push(...values);
    saveLocalData(sheetName, existing);
    return { updates: { updatedRows: values.length } };
  }

  try {
    const client = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = (await rateLimitedRequest(() =>
      client.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!${range}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      }),
    )) as { data: any };

    return response.data;
  } catch (error) {
    console.error(`Error appending to sheet ${sheetName}:`, error);
    throw new Error(
      `Failed to append to Google Sheets: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Update data in a sheet tab
 */
export async function updateSheetData(
  sheetName: string,
  range: string,
  values: any[][],
): Promise<any> {
  if (!isLiveSheetsConfigured()) {
    const existing = getLocalData(sheetName);
    const match = range.match(/[A-Z]+(\d+)/);
    if (match) {
      const rowIndex = parseInt(match[1], 10) - 1; // 0-based
      if (rowIndex >= 0 && rowIndex < existing.length) {
        existing[rowIndex] = values[0];
        saveLocalData(sheetName, existing);
      }
    }
    return { updates: { updatedRows: 1 } };
  }

  try {
    const client = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = (await rateLimitedRequest(() =>
      client.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${range}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      }),
    )) as { data: any };

    return response.data;
  } catch (error) {
    console.error(`Error updating sheet ${sheetName}:`, error);
    throw new Error(
      `Failed to update Google Sheets: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Delete a row from a sheet tab
 */
export async function deleteSheetRow(sheetName: string, rowIndex: number): Promise<any> {
  if (!isLiveSheetsConfigured()) {
    const existing = getLocalData(sheetName);
    if (rowIndex >= 1 && rowIndex <= existing.length) {
      existing.splice(rowIndex - 1, 1);
      saveLocalData(sheetName, existing);
    }
    return {};
  }

  try {
    const client = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const spreadsheet = (await rateLimitedRequest(() =>
      client.spreadsheets.get({ spreadsheetId }),
    )) as { data: { sheets?: Array<{ properties?: { title?: string; sheetId?: number } }> } };

    const sheet = spreadsheet.data.sheets?.find(
      (s: { properties?: { title?: string; sheetId?: number } }) =>
        s.properties?.title === sheetName,
    );
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) {
      throw new Error(`Sheet ${sheetName} not found`);
    }

    const response = (await rateLimitedRequest(() =>
      client.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex,
                },
              },
            },
          ],
        },
      }),
    )) as { data: any };

    return response.data;
  } catch (error) {
    console.error(`Error deleting row from sheet ${sheetName}:`, error);
    throw new Error(
      `Failed to delete row from Google Sheets: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Clear data from a sheet tab range
 */
export async function clearSheetData(sheetName: string, range: string): Promise<any> {
  if (!isLiveSheetsConfigured()) {
    saveLocalData(sheetName, []);
    return {};
  }

  try {
    const client = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = (await rateLimitedRequest(() =>
      client.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!${range}`,
      }),
    )) as { data: any };

    return response.data;
  } catch (error) {
    console.error(`Error clearing sheet ${sheetName}:`, error);
    throw new Error(
      `Failed to clear Google Sheets: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get or create a sheet tab if it doesn't exist
 */
export async function getOrCreateSheet(sheetName: string, headers: string[]): Promise<number> {
  if (!isLiveSheetsConfigured()) {
    const existing = getLocalData(sheetName);
    if (existing.length === 0) {
      saveLocalData(sheetName, [headers]);
    }
    return 1;
  }

  try {
    const client = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const spreadsheet = (await rateLimitedRequest(() =>
      client.spreadsheets.get({ spreadsheetId }),
    )) as { data: { sheets?: Array<{ properties?: { title?: string; sheetId?: number } }> } };

    const existingSheet = spreadsheet.data.sheets?.find(
      (sheet: { properties?: { title?: string; sheetId?: number } }) =>
        sheet.properties?.title === sheetName,
    );

    if (existingSheet) {
      return existingSheet.properties?.sheetId || 0;
    }

    const response = (await rateLimitedRequest(() =>
      client.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      }),
    )) as { data: { replies?: Array<{ addSheet?: { properties?: { sheetId?: number } } }> } };

    const newSheetId = response.data.replies?.[0]?.addSheet?.properties?.sheetId;

    if (newSheetId) {
      await rateLimitedRequest(() =>
        client.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [headers] },
        }),
      );
    }

    return newSheetId || 0;
  } catch (error) {
    console.error(`Error getting or creating sheet ${sheetName}:`, error);
    throw new Error(
      `Failed to get or create Google Sheet: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
