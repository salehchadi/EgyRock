import { describe, it, expect } from "vitest";
import {
  DEFAULT_PAGE_SETTINGS,
  MAX_BODY,
  MAX_GALLERY_IMAGES,
  MAX_SECTIONS,
  MAX_SECTIONS_CELL_CHARS,
  SECTION_LABELS,
  SECTION_TYPES,
  createSection,
  duplicateSectionAt,
  moveSection,
  normalizeSection,
  normalizeSections,
  normalizeSettings,
  parseSectionsCell,
  parseSettingsCell,
  pickLocalized,
  removeSectionAt,
  serializeSections,
  serializeSettings,
  validateSections,
} from "@/lib/pageSections";
import type { PageSection, TextSection } from "@/types";

/**
 * `src/lib/pageSections.ts` is the pure shared core of the page builder: the
 * DAL, admin API, builder UI and storefront renderer all depend on these
 * round-trip / validation guarantees.
 */

function textSection(overrides: Partial<TextSection> = {}): TextSection {
  return {
    id: "txt-1",
    type: "text",
    body: { en: "Hello", ar: "مرحبا", fr: "Bonjour" },
    align: "left",
    ...overrides,
  };
}

describe("SECTION_TYPES / SECTION_LABELS", () => {
  it("lists all nine section types with a label for each", () => {
    expect(SECTION_TYPES).toHaveLength(9);
    expect(new Set(SECTION_TYPES).size).toBe(9);
    for (const type of SECTION_TYPES) {
      expect(SECTION_LABELS[type]).toBeTruthy();
    }
  });
});

describe("createSection", () => {
  it("creates a valid, empty section for every section type", () => {
    for (const type of SECTION_TYPES) {
      const section = createSection(type);
      expect(section.type).toBe(type);
      expect(section.id).toMatch(/^sec-/);
      // Whatever createSection emits must pass the strict write-path validator.
      expect(() => validateSections([section])).not.toThrow();
    }
  });

  it("gives fresh sections unique ids", () => {
    const ids = new Set(Array.from({ length: 20 }, () => createSection("divider").id));
    expect(ids.size).toBe(20);
  });
});

describe("serialization round-trip", () => {
  it("round-trips one fully-populated section of every type through JSON cells", () => {
    const sections: PageSection[] = [
      {
        id: "hero-1",
        type: "hero",
        title: { en: "Loud", ar: "صاخب", fr: "Fort" },
        subtitle: { en: "Sub", ar: "", fr: "" },
        image_url: "/img/hero.jpg",
        button_label: { en: "Shop", ar: "تسوق", fr: "Acheter" },
        button_link: "/en/catalog",
        align: "center",
      },
      {
        id: "head-1",
        type: "heading",
        text: { en: "Section", ar: "", fr: "" },
        level: 3,
        align: "left",
      },
      textSection(),
      {
        id: "img-1",
        type: "image",
        image_url: "/img/live.jpg",
        alt: { en: "Live", ar: "حفلة", fr: "Live" },
        caption: { en: "Whisky bar", ar: "", fr: "" },
      },
      {
        id: "gal-1",
        type: "gallery",
        images: ["/img/a.jpg", "/img/b.jpg"],
        alt: { en: "Gallery", ar: "", fr: "" },
        columns: 4,
      },
      {
        id: "faq-1",
        type: "faq",
        title: { en: "FAQ", ar: "", fr: "" },
        items: [
          {
            id: "q-1",
            question: { en: "Why?", ar: "لماذا؟", fr: "?" },
            answer: { en: "Because.", ar: "", fr: "" },
          },
        ],
      },
      {
        id: "prod-1",
        type: "products",
        title: { en: "Merch", ar: "", fr: "" },
        category_id: "t-shirts",
        limit: 12,
      },
      {
        id: "cta-1",
        type: "cta",
        title: { en: "Join us", ar: "", fr: "" },
        body: { en: "Streetwear from Cairo.", ar: "", fr: "" },
        button_label: { en: "Go", ar: "", fr: "" },
        button_link: "https://instagram.com",
      },
      { id: "div-1", type: "divider", style: "stamp" },
    ];

    const parsed = parseSectionsCell(serializeSections(sections));
    expect(parsed).toEqual(normalizeSections(sections));
    expect(parsed).toHaveLength(9);
    expect(parsed.map((s) => s.type)).toEqual([...SECTION_TYPES]);
  });

  it("round-trips settings through the settings cell", () => {
    const settings = { width: "full", background: "brand-tint", show_title: false } as const;
    expect(parseSettingsCell(serializeSettings(settings))).toEqual(settings);
  });
});

describe("parse cell fallbacks", () => {
  it("treats empty and whitespace sections cells as an empty list", () => {
    expect(parseSectionsCell(undefined)).toEqual([]);
    expect(parseSectionsCell("")).toEqual([]);
    expect(parseSectionsCell("   ")).toEqual([]);
  });

  it("never throws on malformed sections JSON", () => {
    expect(parseSectionsCell("{not json")).toEqual([]);
    expect(parseSectionsCell('"a string"')).toEqual([]);
    expect(parseSectionsCell('{"type":"hero"}')).toEqual([]); // object, not array
  });

  it("falls back to default settings for empty or malformed settings cells", () => {
    expect(parseSettingsCell(undefined)).toEqual(DEFAULT_PAGE_SETTINGS);
    expect(parseSettingsCell("   ")).toEqual(DEFAULT_PAGE_SETTINGS);
    expect(parseSettingsCell("{oops")).toEqual(DEFAULT_PAGE_SETTINGS);
    expect(parseSettingsCell("[1,2]")).toEqual(DEFAULT_PAGE_SETTINGS); // array → defaults
  });
});

describe("validateSections (strict write path)", () => {
  it("treats null/undefined as an empty list", () => {
    expect(validateSections(undefined)).toEqual([]);
    expect(validateSections(null)).toEqual([]);
  });

  it("rejects non-array values", () => {
    expect(() => validateSections("hero")).toThrow(/sections must be an array/i);
    expect(() => validateSections({ type: "hero" })).toThrow(/sections must be an array/i);
  });

  it("rejects unknown section types instead of dropping them", () => {
    expect(() => validateSections([{ id: "x", type: "marquee" }])).toThrow(
      /Invalid section #1 \(type "marquee"\)/,
    );
    expect(() => validateSections([textSection(), { id: "y" }])).toThrow(
      /Invalid section #2 \(type "missing"\)/,
    );
  });

  it("rejects lists over the MAX_SECTIONS cap", () => {
    const many = Array.from({ length: MAX_SECTIONS + 1 }, () => createSection("divider"));
    expect(() => validateSections(many)).toThrow(
      new RegExp(`Too many sections \\(max ${MAX_SECTIONS}\\)`),
    );
  });

  it("returns the normalized list for valid input", () => {
    const [section] = validateSections([{ type: "heading", text: { en: "Hi" }, level: "3" }]);
    expect(section).toMatchObject({ type: "heading", level: 3, align: "left" });
    expect(section.id).toMatch(/^sec-/); // missing id is generated
  });
});

describe("normalizeSection coercion", () => {
  it("returns null for unknown types and non-objects", () => {
    expect(normalizeSection({ id: "x", type: "marquee" })).toBeNull();
    expect(normalizeSection(null)).toBeNull();
    expect(normalizeSection("hero")).toBeNull();
    expect(normalizeSection([1, 2])).toBeNull();
    expect(normalizeSection(undefined)).toBeNull();
  });

  it("coerces invalid enums and numbers back to safe values", () => {
    expect(normalizeSection({ type: "heading", level: 7 })).toMatchObject({ level: 2 });
    expect(normalizeSection({ type: "heading", level: "3" })).toMatchObject({ level: 3 });
    expect(normalizeSection({ type: "hero", align: "middle" })).toMatchObject({ align: "left" });
    expect(normalizeSection({ type: "gallery", columns: 99 })).toMatchObject({ columns: 3 });
    expect(normalizeSection({ type: "divider", style: "zigzag" })).toMatchObject({ style: "line" });
    expect(normalizeSection({ type: "products", limit: 0 })).toMatchObject({ limit: 1 });
    expect(normalizeSection({ type: "products", limit: 999 })).toMatchObject({ limit: 24 });
    expect(normalizeSection({ type: "products", limit: "abc" })).toMatchObject({ limit: 8 });
  });

  it("truncates oversized bodies to MAX_BODY", () => {
    const long = "x".repeat(MAX_BODY + 500);
    const body = normalizeSection({ type: "text", body: { en: long } }) as TextSection;
    expect(body.body.en).toHaveLength(MAX_BODY);
  });

  it("caps gallery images and drops empty entries", () => {
    const images = [...Array.from({ length: 40 }, (_, i) => `/img/${i}.jpg`), ""];
    const gallery = normalizeSection({ type: "gallery", images });
    expect(gallery).toMatchObject({ images: images.slice(0, MAX_GALLERY_IMAGES) });

    const empty = normalizeSection({ type: "gallery", images: "nope" });
    expect(empty).toMatchObject({ images: [] });
  });

  it("drops FAQ items that are not objects", () => {
    const faq = normalizeSection({
      type: "faq",
      items: [null, "q", { id: "q1", question: { en: "Q" }, answer: { en: "A" } }],
    });
    expect(faq).toMatchObject({
      items: [{ id: "q1", question: { en: "Q" }, answer: { en: "A" } }],
    });
  });

  it("strips unknown keys so stored JSON stays well-formed", () => {
    const section = normalizeSection({ type: "divider", style: "line", evil: "<script>" });
    expect(section).toEqual({ id: expect.any(String), type: "divider", style: "line" });
  });
});

describe("normalizeSections", () => {
  it("returns an empty list for non-arrays", () => {
    expect(normalizeSections(undefined)).toEqual([]);
    expect(normalizeSections({})).toEqual([]);
  });

  it("drops unknown entries and caps the list at MAX_SECTIONS", () => {
    const raw = [...Array.from({ length: 65 }, () => ({ type: "divider" })), { type: "bogus" }];
    expect(normalizeSections(raw)).toHaveLength(MAX_SECTIONS);
  });
});

describe("normalizeSettings", () => {
  it("falls back field-by-field for invalid values", () => {
    expect(normalizeSettings({ width: "huge", background: "neon" })).toEqual(DEFAULT_PAGE_SETTINGS);
    expect(normalizeSettings(null)).toEqual(DEFAULT_PAGE_SETTINGS);
    expect(normalizeSettings("wide")).toEqual(DEFAULT_PAGE_SETTINGS);
  });

  it("coerces show_title from boolean-ish values", () => {
    expect(normalizeSettings({ show_title: "false" }).show_title).toBe(false);
    expect(normalizeSettings({ show_title: 0 }).show_title).toBe(false);
    expect(normalizeSettings({ show_title: "1" }).show_title).toBe(true);
    expect(normalizeSettings({ show_title: "maybe" }).show_title).toBe(true); // default
  });
});

describe("serializeSections size cap", () => {
  it("throws a friendly error past the Google Sheets cell limit", () => {
    const bigBody = "x".repeat(20_000);
    const sections = ["a", "b", "c"].map((id) =>
      textSection({ id, body: { en: bigBody, ar: "", fr: "" } }),
    );
    expect(JSON.stringify(sections).length).toBeGreaterThan(MAX_SECTIONS_CELL_CHARS);

    expect(() => serializeSections(sections)).toThrow(/too large/i);
  });
});

describe("builder list helpers", () => {
  const list = (): PageSection[] => [
    textSection({ id: "one" }),
    textSection({ id: "two" }),
    textSection({ id: "three" }),
  ];

  it("moveSection reorders forwards and backwards", () => {
    expect(moveSection(list(), 0, 1).map((s) => s.id)).toEqual(["two", "one", "three"]);
    expect(moveSection(list(), 2, -1).map((s) => s.id)).toEqual(["one", "three", "two"]);
  });

  it("moveSection is a no-op at the edges", () => {
    const original = list();
    expect(moveSection(original, 0, -1)).toBe(original);
    expect(moveSection(original, 2, 1)).toBe(original);
    expect(moveSection(original, -1, 1)).toBe(original);
  });

  it("duplicateSectionAt deep-clones after the index with fresh ids", () => {
    const next = duplicateSectionAt(list(), 0);
    expect(next).toHaveLength(4);
    expect(next[0].id).toBe("one");
    expect(next[1].id).not.toBe("one"); // fresh id for the clone
    expect(next[2].id).toBe("two");
    expect(next[3].id).toBe("three");

    const faq: PageSection = {
      id: "faq",
      type: "faq",
      title: { en: "", ar: "", fr: "" },
      items: [
        { id: "q1", question: { en: "Q", ar: "", fr: "" }, answer: { en: "A", ar: "", fr: "" } },
      ],
    };
    const withFaq = duplicateSectionAt([faq], 0);
    const clone = withFaq[1];
    expect(clone.type).toBe("faq");
    expect(clone.id).not.toBe("faq");
    if (clone.type === "faq" && faq.type === "faq") {
      // FAQ item ids are regenerated too, but the content survives the clone.
      expect(clone.items[0].id).not.toBe("q1");
      expect(clone.items[0].question).toEqual(faq.items[0].question);
      expect(faq.items[0].id).toBe("q1"); // original untouched
    }
  });

  it("removeSectionAt removes in range and is a no-op out of range", () => {
    expect(removeSectionAt(list(), 1).map((s) => s.id)).toEqual(["one", "three"]);
    const original = list();
    expect(removeSectionAt(original, 5)).toBe(original);
    expect(removeSectionAt(original, -1)).toBe(original);
  });
});

describe("pickLocalized", () => {
  const text = { en: "English", ar: "عربي", fr: "Français" };

  it("picks the requested locale", () => {
    expect(pickLocalized(text, "ar")).toBe("عربي");
    expect(pickLocalized(text, "fr")).toBe("Français");
    expect(pickLocalized(text, "en")).toBe("English");
  });

  it("falls back to English for unsupported locales and empty translations", () => {
    expect(pickLocalized(text, "de")).toBe("English");
    expect(pickLocalized({ en: "", ar: "عربي", fr: "" }, "en")).toBe("عربي");
    expect(pickLocalized(null, "en")).toBe("");
    expect(pickLocalized(undefined, "ar")).toBe("");
  });
});
