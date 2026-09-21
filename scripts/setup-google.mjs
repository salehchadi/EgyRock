#!/usr/bin/env node
/**
 * EgyRock Google Sheets Auto-Setup Script
 *
 * Mode A (recommended — service accounts cannot create Drive files):
 *   1. In your browser: https://sheets.new  → name it "EgyRock Database"
 *   2. Copy the full URL of the sheet
 *   3. Run:
 *      node scripts/setup-google.mjs /path/to/service-account-key.json --sheet-url "https://docs.google.com/spreadsheets/d/YOUR_ID/edit"
 *
 * Mode B (only works if the service account has Drive storage quota):
 *   node scripts/setup-google.mjs /path/to/service-account-key.json
 *
 * The script will:
 * 1. Read your downloaded service account JSON key
 * 2. Attach to (or create) the Google Sheet
 * 3. Share it with the service account automatically (Mode B only)
 * 4. Write .env.local with all required values
 * 5. Run sheet initialization (create tabs & headers)
 * 6. Run the seed script (populate sample data)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

async function main() {
  const args = process.argv.slice(2);
  const keyFilePath = args.find((a) => !a.startsWith("--"));
  const sheetUrlIdx = args.indexOf("--sheet-url");
  const sheetUrl =
    sheetUrlIdx !== -1 ? args[sheetUrlIdx + 1] : undefined;

  if (!keyFilePath || (sheetUrlIdx !== -1 && !sheetUrl)) {
    console.error(
      "\n❌  Usage:\n" +
        "    node scripts/setup-google.mjs <key.json> --sheet-url \"<sheet URL>\"\n" +
        "    node scripts/setup-google.mjs <key.json>   (creates a new sheet — needs Drive quota)\n",
    );
    process.exit(1);
  }

  // Extract spreadsheet ID from a full URL or raw ID
  let existingSheetId;
  if (sheetUrl) {
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    existingSheetId = match ? match[1] : sheetUrl.trim();
    console.log(`\n📎  Attaching to existing sheet: ${existingSheetId}`);
  }

  const absKeyPath = path.resolve(keyFilePath);
  if (!fs.existsSync(absKeyPath)) {
    console.error(`\n❌  File not found: ${absKeyPath}\n`);
    process.exit(1);
  }

  console.log("\n🎸  EgyRock — Google Sheets Auto-Setup\n");

  // 1. Parse the service account key
  let keyJson;
  try {
    keyJson = JSON.parse(fs.readFileSync(absKeyPath, "utf-8"));
  } catch (e) {
    console.error("❌  Failed to parse the JSON key file. Make sure it's a valid Google service account key.");
    process.exit(1);
  }

  const serviceAccountEmail = keyJson.client_email;
  const privateKey = keyJson.private_key;

  if (!serviceAccountEmail || !privateKey) {
    console.error("❌  The JSON key file does not look like a valid Google service account key.");
    process.exit(1);
  }

  console.log(`✅  Service Account: ${serviceAccountEmail}`);

  // 2. Authenticate with Google APIs
  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  // 3. Create a new Google Sheet (Mode B) or verify access to existing one (Mode A)
  console.log("📊  Connecting to Google Sheets...");
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  let sheetId;
  if (existingSheetId) {
    // Mode A: verify we can read the sheet the user created & shared
    try {
      const meta = await sheets.spreadsheets.get({
        spreadsheetId: existingSheetId,
      });
      sheetId = existingSheetId;
      console.log(
        `✅  Connected: "${meta.data.properties?.title}" (${(meta.data.sheets || []).length} tabs)`,
      );
    } catch (err) {
      console.error("❌  Cannot read the sheet:", err.message);
      console.error(
        `    → Make sure you shared the sheet with:\n      ${serviceAccountEmail}\n    → as **Editor** (Share → add email → Editor).`,
      );
      process.exit(1);
    }
  } else {
    // Mode B: create the spreadsheet via the API
    try {
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title: "EgyRock Database" },
          sheets: [
            { properties: { title: "Products" } },
            { properties: { title: "Categories" } },
            { properties: { title: "Orders" } },
            { properties: { title: "Users" } },
            { properties: { title: "HomepageImages" } },
            { properties: { title: "Translations" } },
            { properties: { title: "Pages" } },
          ],
        },
      });

      sheetId = createResponse.data.spreadsheetId;
      console.log(`✅  Sheet created: https://docs.google.com/spreadsheets/d/${sheetId}`);
    } catch (err) {
      console.error("❌  Failed to create Google Sheet:", err.message);
      console.error(
        "    Service accounts on consumer projects cannot create files (storage quota = 0).\n" +
          "    Use Mode A instead:\n" +
          "      1. Open https://sheets.new in your browser\n" +
          '      2. Share the sheet with this service account (Editor):\n         ' +
          serviceAccountEmail +
          '\n      3. Re-run with: node scripts/setup-google.mjs "' +
          absKeyPath +
          '" --sheet-url "<your sheet URL>"',
      );
      process.exit(1);
    }
  }

  // 4. Make the sheet accessible (only relevant when we just created it)
  if (!existingSheetId) {
    try {
      await drive.permissions.create({
        fileId: sheetId,
        requestBody: {
          role: "writer",
          type: "user",
          emailAddress: serviceAccountEmail,
        },
      });
      console.log("✅  Sheet shared with service account");
    } catch (err) {
      // Service accounts own files they create, this is expected to sometimes fail
      console.log("ℹ️   Sheet ownership already set (service account owns the file)");
    }
  }

  // 5. Generate NEXTAUTH_SECRET
  const nextauthSecret = crypto.randomBytes(32).toString("base64");

  // 6. Write .env.local
  const envPath = path.join(ROOT, ".env.local");
  const privateKeyEscaped = privateKey.replace(/\n/g, "\\n");

  const envContent = `# Auto-generated by scripts/setup-google.mjs on ${new Date().toISOString()}
# Do NOT commit this file to version control

# Google Sheets Data Access Layer (Server-Side Only)
GOOGLE_SERVICE_ACCOUNT_EMAIL="${serviceAccountEmail}"
GOOGLE_PRIVATE_KEY="${privateKeyEscaped}"
GOOGLE_SHEET_ID="${sheetId}"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${nextauthSecret}"

# Store Settings & Defaults (Public)
NEXT_PUBLIC_INSTAPAY_HANDLE="egyrock@instapay"
NEXT_PUBLIC_DEFAULT_LOW_STOCK_THRESHOLD="5"
`;

  fs.writeFileSync(envPath, envContent, "utf-8");
  console.log("✅  .env.local written");

  // 7. Run sheet init (create headers)
  console.log("\n🔧  Initializing sheet tabs & headers...");
  try {
    execSync("npx tsx scripts/init-sheets.ts", {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, ...parseEnv(envContent) },
    });
    console.log("✅  Sheet initialized");
  } catch (err) {
    console.error("❌  init-sheets failed:", err.message);
  }

  // 8. Run seed
  console.log("\n🌱  Seeding sample data...");
  try {
    execSync("npx tsx scripts/seed.ts", {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, ...parseEnv(envContent) },
    });
    console.log("✅  Seed complete");
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          🎸  EgyRock Setup Complete!                         ║
╠══════════════════════════════════════════════════════════════╣
║  Google Sheet ID: ${sheetId.padEnd(42)}║
║  Sheet URL: https://docs.google.com/spreadsheets/d/${sheetId.substring(0, 10)}...  ║
║                                                              ║
║  Next steps:                                                 ║
║  1. Run: npm run dev                                         ║
║  2. Log in with: admin@egyrock.com / admin123                ║
║                                                              ║
║  For Vercel deployment, add these env vars to your project:  ║
║  - GOOGLE_SERVICE_ACCOUNT_EMAIL                              ║
║  - GOOGLE_PRIVATE_KEY                                        ║
║  - GOOGLE_SHEET_ID                                           ║
║  - NEXTAUTH_SECRET                                           ║
║  - NEXTAUTH_URL (set to your Vercel domain)                  ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function parseEnv(envContent) {
  const vars = {};
  for (const line of envContent.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    const value = rest.join("=").replace(/^"|"$/g, "").replace(/\\n/g, "\n");
    vars[key.trim()] = value;
  }
  return vars;
}

main().catch((err) => {
  console.error("\n❌  Unexpected error:", err);
  process.exit(1);
});
