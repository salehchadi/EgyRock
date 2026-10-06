import { google } from "googleapis";
import { TAB_HEADERS, readTab } from "../src/lib/data/sheetsClient";

/** 0-based column index → spreadsheet letter (0 → A, 10 → K, 26 → AA). */
function columnLetter(index: number): string {
  let n = Math.max(0, index);
  let letters = "";
  do {
    letters = String.fromCharCode(65 + (n % 26)) + letters;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letters;
}

async function main() {
  console.log("📊 [EgyRock] Initializing database sheets & tabs...");

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  const isLiveConfigured = Boolean(
    email &&
    rawKey &&
    sheetId &&
    !email.includes("your-service-account") &&
    !sheetId.includes("your_google_sheet"),
  );

  if (isLiveConfigured) {
    console.log("🔗 Connecting to Google Sheets API...");
    const privateKey = (rawKey || "").replace(/\\n/g, "\n");
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 1. Get existing sheets
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId! });
    const existingTitles = new Set(
      (meta.data.sheets || []).map((s) => s.properties?.title).filter(Boolean),
    );

    console.log("📑 Existing tabs found:", Array.from(existingTitles).join(", ") || "(none)");

    // 2. Add missing sheets
    for (const [tabName, headers] of Object.entries(TAB_HEADERS)) {
      if (!existingTitles.has(tabName)) {
        console.log(`➕ Creating tab: "${tabName}"...`);
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId!,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: tabName },
                },
              },
            ],
          },
        });
      }

      // Check if header row exists
      const checkRows = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId!,
        range: `${tabName}!A1:Z1`,
      });

      if (!checkRows.data.values || checkRows.data.values.length === 0) {
        console.log(`📝 Writing header row for "${tabName}"...`);
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId!,
          range: `${tabName}!A1:Z1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [headers],
          },
        });
      } else {
        // Non-destructive migration: append any missing header columns
        // (e.g. `sections`/`settings` on the Pages tab) without touching
        // existing columns or data rows.
        const existing = (checkRows.data.values[0] || []).map((h) => String(h ?? ""));
        const missing = headers.filter((h) => !existing.includes(h));
        for (const header of missing) {
          const col = columnLetter(headers.indexOf(header));
          console.log(`➕ Adding header column "${header}" to "${tabName}" (${col}1)...`);
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId!,
            range: `${tabName}!${col}1:${col}1`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[header]] },
          });
        }
      }
    }

    console.log("✅ [EgyRock] Google Sheets initialization complete!");
  } else {
    console.log("⚡ No live Google credentials detected in environment.");
    console.log("📂 Initializing local persistent store (.data/local-db.json)...");
    for (const tabName of Object.keys(TAB_HEADERS)) {
      await readTab(tabName);
    }
    console.log("✅ [EgyRock] Local store tabs initialized successfully!");
    console.log(
      "👉 When ready, add GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID to .env.local and run `npm run db:init` again.",
    );
  }
}

main().catch((err) => {
  console.error("❌ Database initialization failed:", err);
  process.exit(1);
});
