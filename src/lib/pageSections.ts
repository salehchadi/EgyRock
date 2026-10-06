import type {
  CtaSection,
  DividerSection,
  FaqItem,
  FaqSection,
  GallerySection,
  HeadingSection,
  HeroSection,
  ImageSection,
  LocalizedText,
  PageBackground,
  PageSection,
  PageSettings,
  PageWidth,
  ProductsSection,
  SectionAlign,
  SectionType,
  TextSection,
} from "@/types";

/* ================================================================
   Page-builder section helpers — shared by the DAL (Google Sheets
   JSON cells), the admin API (write-time validation), the admin
   builder UI (add/reorder/duplicate) and the storefront renderer.
   Pure module: no server-only imports, safe for client bundles.
   ================================================================ */

export const SECTION_TYPES: readonly SectionType[] = [
  "hero",
  "heading",
  "text",
  "image",
  "gallery",
  "faq",
  "products",
  "cta",
  "divider",
] as const;

/** Labels shown in the admin "Add section" picker. */
export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero Banner",
  heading: "Heading",
  text: "Text Block",
  image: "Image",
  gallery: "Image Gallery",
  faq: "FAQ",
  products: "Product Showcase",
  cta: "Call to Action",
  divider: "Divider",
};

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  width: "wide",
  background: "default",
  show_title: true,
};

/**
 * Google Sheets hard-limits a cell to 50,000 characters; keep headroom
 * for JSON quoting and reject oversized pages with a friendly error.
 */
export const MAX_SECTIONS_CELL_CHARS = 48_000;
export const MAX_SECTIONS = 60;
export const MAX_GALLERY_IMAGES = 24;
export const MAX_FAQ_ITEMS = 40;
export const MAX_PRODUCT_LIMIT = 24;
/** Plain-text field cap (chars) — localized strings / titles / labels. */
export const MAX_TEXT = 10_000;
/** Long-form body cap (chars) — text & FAQ answers. */
export const MAX_BODY = 20_000;
export const MAX_URL = 2_000;

let idCounter = 0;

/** Collision-resistant client-side id for sections and FAQ items. */
export function newSectionId(): string {
  idCounter = (idCounter + 1) % 10_000;
  return `sec-${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyLocalized(): LocalizedText {
  return { en: "", ar: "", fr: "" };
}

/* ------------------------- coercion helpers ------------------------- */

function asString(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  return value.length > max ? value.slice(0, max) : value;
}

function asUrl(value: unknown): string {
  return asString(value, MAX_URL).trim();
}

function asLocalized(value: unknown, max = MAX_TEXT): LocalizedText {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    en: asString(raw.en, max),
    ar: asString(raw.ar, max),
    fr: asString(raw.fr, max),
  };
}

function asOneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function asIntEnum(value: unknown, allowed: readonly number[], fallback: number): number {
  const n = Number(value);
  return allowed.includes(n) ? n : fallback;
}

function asInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

function asStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map((item) => asUrl(item))
    .filter(Boolean);
}

const ALIGNS: readonly SectionAlign[] = ["left", "center"] as const;
const WIDTHS: readonly PageWidth[] = ["narrow", "wide", "full"] as const;
const BACKGROUNDS: readonly PageBackground[] = [
  "default",
  "surface",
  "sunken",
  "brand-tint",
] as const;

/* --------------------------- normalization --------------------------- */

/**
 * Lenient per-section normalization. Coerces any (possibly corrupt)
 * parsed JSON object into a well-formed section; returns `null` when the
 * type is unknown or the value is not an object.
 */
export function normalizeSection(value: unknown): PageSection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const id = asString(raw.id, 120) || newSectionId();
  const align = asOneOf(raw.align, ALIGNS, "left");

  switch (raw.type) {
    case "hero": {
      const section: HeroSection = {
        id,
        type: "hero",
        title: asLocalized(raw.title),
        subtitle: asLocalized(raw.subtitle),
        image_url: asUrl(raw.image_url),
        button_label: asLocalized(raw.button_label),
        button_link: asUrl(raw.button_link),
        align,
      };
      return section;
    }
    case "heading": {
      const section: HeadingSection = {
        id,
        type: "heading",
        text: asLocalized(raw.text),
        level: asIntEnum(raw.level, [2, 3], 2) as 2 | 3,
        align,
      };
      return section;
    }
    case "text": {
      const section: TextSection = {
        id,
        type: "text",
        body: asLocalized(raw.body, MAX_BODY),
        align,
      };
      return section;
    }
    case "image": {
      const section: ImageSection = {
        id,
        type: "image",
        image_url: asUrl(raw.image_url),
        alt: asLocalized(raw.alt),
        caption: asLocalized(raw.caption),
      };
      return section;
    }
    case "gallery": {
      const section: GallerySection = {
        id,
        type: "gallery",
        images: asStringArray(raw.images, MAX_GALLERY_IMAGES),
        alt: asLocalized(raw.alt),
        columns: asIntEnum(raw.columns, [2, 3, 4], 3) as 2 | 3 | 4,
      };
      return section;
    }
    case "faq": {
      const rawItems = Array.isArray(raw.items) ? raw.items.slice(0, MAX_FAQ_ITEMS) : [];
      const items: FaqItem[] = rawItems
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item),
        )
        .map((item) => ({
          id: asString(item.id, 120) || newSectionId(),
          question: asLocalized(item.question),
          answer: asLocalized(item.answer, MAX_BODY),
        }));
      const section: FaqSection = {
        id,
        type: "faq",
        title: asLocalized(raw.title),
        items,
      };
      return section;
    }
    case "products": {
      const section: ProductsSection = {
        id,
        type: "products",
        title: asLocalized(raw.title),
        category_id: asString(raw.category_id, 120),
        limit: asInt(raw.limit, 1, MAX_PRODUCT_LIMIT, 8),
      };
      return section;
    }
    case "cta": {
      const section: CtaSection = {
        id,
        type: "cta",
        title: asLocalized(raw.title),
        body: asLocalized(raw.body),
        button_label: asLocalized(raw.button_label),
        button_link: asUrl(raw.button_link),
      };
      return section;
    }
    case "divider": {
      const section: DividerSection = {
        id,
        type: "divider",
        style: asOneOf(raw.style, ["line", "stamp"] as const, "line"),
      };
      return section;
    }
    default:
      return null;
  }
}

/** Lenient read path: parsed sheet JSON → well-formed section list. */
export function normalizeSections(value: unknown): PageSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_SECTIONS)
    .map((item) => normalizeSection(item))
    .filter((section): section is PageSection => section !== null);
}

/**
 * Strict write path (admin API): validates structure and enforces the
 * section-type whitelist — unknown types are rejected, not silently
 * dropped. Returns the normalized list.
 */
export function validateSections(value: unknown): PageSection[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error("sections must be an array");
  }
  if (value.length > MAX_SECTIONS) {
    throw new Error(`Too many sections (max ${MAX_SECTIONS})`);
  }
  return value.map((item, index) => {
    const section = normalizeSection(item);
    if (!section) {
      const type =
        item && typeof item === "object" && "type" in item
          ? String((item as Record<string, unknown>).type)
          : "missing";
      throw new Error(`Invalid section #${index + 1} (type "${type}")`);
    }
    return section;
  });
}

/** Lenient read path for the settings JSON cell. */
export function normalizeSettings(value: unknown): PageSettings {
  const raw = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<
    string,
    unknown
  >;
  return {
    width: asOneOf(raw.width, WIDTHS, DEFAULT_PAGE_SETTINGS.width),
    background: asOneOf(raw.background, BACKGROUNDS, DEFAULT_PAGE_SETTINGS.background),
    show_title: asBoolean(raw.show_title, DEFAULT_PAGE_SETTINGS.show_title),
  };
}

/* ---------------------------- serialization ---------------------------- */

/** JSON-serializes sections, enforcing the Google Sheets cell size cap. */
export function serializeSections(sections: PageSection[]): string {
  const json = JSON.stringify(normalizeSections(sections));
  if (json.length > MAX_SECTIONS_CELL_CHARS) {
    throw new Error(
      `Page content is too large to save (${json.length.toLocaleString()} chars, max ${MAX_SECTIONS_CELL_CHARS.toLocaleString()}). Remove some sections or images.`,
    );
  }
  return json;
}

export function serializeSettings(settings: PageSettings): string {
  return JSON.stringify(normalizeSettings(settings));
}

/** Safe parse for sheet cells: malformed JSON → empty list, never throws. */
export function parseSectionsCell(value: string | undefined): PageSection[] {
  if (!value || !value.trim()) return [];
  try {
    return normalizeSections(JSON.parse(value));
  } catch {
    return [];
  }
}

export function parseSettingsCell(value: string | undefined): PageSettings {
  if (!value || !value.trim()) return { ...DEFAULT_PAGE_SETTINGS };
  try {
    return normalizeSettings(JSON.parse(value));
  } catch {
    return { ...DEFAULT_PAGE_SETTINGS };
  }
}

/* ------------------------------- builder ops ------------------------------- */

export function createSection(type: SectionType): PageSection {
  const id = newSectionId();
  switch (type) {
    case "hero":
      return {
        id,
        type,
        title: emptyLocalized(),
        subtitle: emptyLocalized(),
        image_url: "",
        button_label: emptyLocalized(),
        button_link: "",
        align: "left",
      };
    case "heading":
      return { id, type, text: emptyLocalized(), level: 2, align: "left" };
    case "text":
      return { id, type, body: emptyLocalized(), align: "left" };
    case "image":
      return { id, type, image_url: "", alt: emptyLocalized(), caption: emptyLocalized() };
    case "gallery":
      return { id, type, images: [], alt: emptyLocalized(), columns: 3 };
    case "faq":
      return { id, type, title: emptyLocalized(), items: [] };
    case "products":
      return { id, type, title: emptyLocalized(), category_id: "", limit: 8 };
    case "cta":
      return {
        id,
        type,
        title: emptyLocalized(),
        body: emptyLocalized(),
        button_label: emptyLocalized(),
        button_link: "",
      };
    case "divider":
      return { id, type, style: "line" };
    default: {
      // Exhaustiveness guard — keeps createSection total if a type is added.
      throw new Error(`Unknown section type: ${String(type)}`);
    }
  }
}

/** Returns a new list with the section moved by `delta` (-1/+1). No-op at edges. */
export function moveSection(list: PageSection[], index: number, delta: number): PageSection[] {
  const target = index + delta;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

/** Returns a new list with a deep clone inserted after `index` (fresh ids). */
export function duplicateSectionAt(list: PageSection[], index: number): PageSection[] {
  const original = list[index];
  if (!original) return list;
  const clone = JSON.parse(JSON.stringify(original)) as PageSection;
  clone.id = newSectionId();
  if (clone.type === "faq") {
    clone.items = clone.items.map((item) => ({ ...item, id: newSectionId() }));
  }
  const next = [...list];
  next.splice(index + 1, 0, clone);
  return next;
}

/** Returns a new list without the section at `index`. */
export function removeSectionAt(list: PageSection[], index: number): PageSection[] {
  if (index < 0 || index >= list.length) return list;
  return list.filter((_, i) => i !== index);
}

/** Picks the localized value for `locale`, falling back to English. */
export function pickLocalized(text: LocalizedText | undefined | null, locale: string): string {
  if (!text) return "";
  const lang = locale === "ar" || locale === "fr" ? locale : "en";
  return text[lang] || text.en || text.ar || text.fr || "";
}
