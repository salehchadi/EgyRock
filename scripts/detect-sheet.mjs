#!/usr/bin/env node
/**
 * Detect spreadsheets shared with a service account.
 * Usage: node scripts/detect-sheet.mjs /path/to/service-account-key.json
 */
import fs from "fs";
import { google } from "googleapis";

const keyFilePath = process.argv[2];
if (!keyFilePath) {
  console.error("Usage: node scripts/detect-sheet.mjs <service-account-key.json>");
  process.exit(1);
}

const key = JSON.parse(fs.readFileSync(keyFilePath, "utf-8"));
const auth = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ],
});

const drive = google.drive({ version: "v3", auth });
const res = await drive.files.list({
  q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
  fields: "files(id, name, owners(displayName, emailAddress), createdTime)",
  pageSize: 25,
});

const files = res.data.files || [];
if (files.length === 0) {
  console.log("NO_SHEETS_FOUND");
  process.exit(0);
}
for (const f of files) {
  console.log(`FOUND\t${f.id}\t${f.name}\t${f.createdTime}`);
}
