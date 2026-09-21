import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type NestedMessages = Record<string, any>;

/**
 * Static JSON files ship the base catalog of UI strings; the admin-editable
 * Translations sheet is overlaid on top so overrides made from the admin
 * panel (Projects sheet "Translations" tab) win at runtime without a redeploy.
 */
function flatten(obj: any, prefix = "", out: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(obj || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") {
      flatten(value, path, out);
    } else {
      out[path] = String(value ?? "");
    }
  }
  return out;
}

function unflatten(flat: Record<string, string>): NestedMessages {
  const out: NestedMessages = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split(".");
    let node = out;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        node[part] = value;
      } else {
        if (typeof node[part] !== "object" || node[part] === null) {
          node[part] = {};
        }
        node = node[part];
      }
    });
  }
  return out;
}

// Short-lived cache: keeps the storefront dynamic (admin edits appear quickly)
// without hitting the Google Sheets API on literally every request.
const OVERLAY_TTL_MS = 30_000;
let overlayCache: {
  key: string;
  data: Record<string, string>;
  at: number;
} | null = null;

async function getDbOverlay(locale: string): Promise<Record<string, string>> {
  // The Translations sheet lives behind the Google Sheets DAL, which uses
  // Node.js APIs (fs/path/process). Middleware runs on the Edge runtime where
  // those cannot be bundled — checking NEXT_RUNTIME lets webpack drop this
  // branch (and the dynamic import below) from the Edge build entirely.
  if (process.env.NEXT_RUNTIME !== "nodejs") return {};

  if (
    overlayCache &&
    overlayCache.key === locale &&
    Date.now() - overlayCache.at < OVERLAY_TTL_MS
  ) {
    return overlayCache.data;
  }
  try {
    const { getTranslationsMap } = await import("@/lib/data/translations");
    const data = await getTranslationsMap(locale as "en" | "ar" | "fr");
    // Only overlay non-empty values so a blank DB cell never wipes a real string
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v && v.trim() !== ""));
    overlayCache = { key: locale, data: clean, at: Date.now() };
    return clean;
  } catch {
    // Never break rendering because the DB is unreachable — static JSON stays the floor
    return overlayCache?.data ?? {};
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "ar" | "fr")) {
    locale = routing.defaultLocale;
  }

  const staticMessages = (await import(`../../messages/${locale}.json`)).default;
  const flat = flatten(staticMessages);
  const overlay = await getDbOverlay(locale);
  // DB translations win over static JSON
  Object.assign(flat, overlay);

  return {
    locale,
    messages: unflatten(flat),
  };
});
