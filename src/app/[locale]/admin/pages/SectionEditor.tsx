"use client";

import React, { useState } from "react";
import type { Category, LocalizedText, PageSection } from "@/types";
import { emptyLocalized, newSectionId, SECTION_LABELS } from "@/lib/pageSections";

/* ================================================================
   SectionEditor — edits a single page-builder section. One card per
   section in the admin stack; localized fields use EN/AR/FR tabs.
   Uses the existing admin utility classes (admin-input, label-field…)
   so the whole panel matches the rest of the admin.
   ================================================================ */

interface SectionEditorProps {
  section: PageSection;
  index: number;
  total: number;
  categories: Category[];
  onChange: (section: PageSection) => void;
  onMove: (delta: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

type Lang = "en" | "ar" | "fr";
const LANGS: readonly Lang[] = ["en", "ar", "fr"] as const;

const CARD_BTN =
  "text-xs px-2 py-1 border border-line hover:border-brand text-ink uppercase font-heading tracking-wider transition disabled:opacity-40 disabled:hover:border-line";

function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  multiline?: boolean;
}) {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="label-field !mb-0">{label}</span>
        <div className="flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`text-[10px] px-2 py-0.5 border uppercase font-heading tracking-wider transition ${
                lang === l ? "border-brand text-brand" : "border-line text-muted hover:text-ink"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {multiline ? (
        <textarea
          className="admin-input min-h-[100px]"
          value={value[lang]}
          dir={lang === "ar" ? "rtl" : "ltr"}
          onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        />
      ) : (
        <input
          className="admin-input"
          value={value[lang]}
          dir={lang === "ar" ? "rtl" : "ltr"}
          onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        />
      )}
    </div>
  );
}

function UrlField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <input
        className="admin-input"
        value={value}
        dir="ltr"
        placeholder={placeholder || "https://…"}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Preview"
          className="mt-2 h-20 w-auto max-w-full border border-line object-cover"
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <select className="admin-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
];

export default function SectionEditor({
  section,
  index,
  total,
  categories,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
}: SectionEditorProps) {
  const [expanded, setExpanded] = useState(index === 0);

  const patch = (partial: Record<string, unknown>) =>
    onChange({ ...section, ...partial } as PageSection);

  return (
    <div className="border-2 border-line bg-surface">
      {/* Card header: type badge + reorder controls */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-line">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 min-w-0 text-left"
        >
          <span className="text-brand text-xs font-heading">{expanded ? "▾" : "▸"}</span>
          <span className="admin-status-pending">#{index + 1}</span>
          <span className="font-heading text-sm uppercase text-ink truncate">
            {SECTION_LABELS[section.type]}
          </span>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            className={CARD_BTN}
            disabled={index === 0}
            onClick={() => onMove(-1)}
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            className={CARD_BTN}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            title="Move down"
          >
            ↓
          </button>
          <button type="button" className={CARD_BTN} onClick={onDuplicate} title="Duplicate">
            Copy
          </button>
          <button
            type="button"
            className="text-xs px-2 py-1 border border-danger text-danger hover:bg-danger/10 uppercase font-heading tracking-wider transition"
            onClick={onDelete}
            title="Delete"
          >
            Del
          </button>
        </div>
      </div>

      {/* Editor body */}
      {expanded && (
        <div className="p-4 space-y-4">
          {section.type === "hero" && (
            <>
              <LocalizedField
                label="Title"
                value={section.title}
                onChange={(title) => patch({ title })}
              />
              <LocalizedField
                label="Subtitle"
                value={section.subtitle}
                onChange={(subtitle) => patch({ subtitle })}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <UrlField
                  label="Background image URL"
                  value={section.image_url}
                  onChange={(image_url) => patch({ image_url })}
                />
                <div className="space-y-4">
                  <LocalizedField
                    label="Button label"
                    value={section.button_label}
                    onChange={(button_label) => patch({ button_label })}
                  />
                  <div>
                    <label className="label-field">Button link</label>
                    <input
                      className="admin-input"
                      dir="ltr"
                      value={section.button_link}
                      placeholder="/en/catalog or https://…"
                      onChange={(e) => patch({ button_link: e.target.value })}
                    />
                  </div>
                  <SelectField
                    label="Alignment"
                    value={section.align}
                    onChange={(align) => patch({ align })}
                    options={ALIGN_OPTIONS}
                  />
                </div>
              </div>
            </>
          )}

          {section.type === "heading" && (
            <>
              <LocalizedField
                label="Heading text"
                value={section.text}
                onChange={(text) => patch({ text })}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField
                  label="Level"
                  value={String(section.level)}
                  onChange={(level) => patch({ level: Number(level) })}
                  options={[
                    { value: "2", label: "H2 (large)" },
                    { value: "3", label: "H3 (medium)" },
                  ]}
                />
                <SelectField
                  label="Alignment"
                  value={section.align}
                  onChange={(align) => patch({ align })}
                  options={ALIGN_OPTIONS}
                />
              </div>
            </>
          )}

          {section.type === "text" && (
            <>
              <LocalizedField
                label="Body text (line breaks preserved)"
                value={section.body}
                onChange={(body) => patch({ body })}
                multiline
              />
              <SelectField
                label="Alignment"
                value={section.align}
                onChange={(align) => patch({ align })}
                options={ALIGN_OPTIONS}
              />
            </>
          )}

          {section.type === "image" && (
            <>
              <UrlField
                label="Image URL"
                value={section.image_url}
                onChange={(image_url) => patch({ image_url })}
              />
              <LocalizedField
                label="Alt text"
                value={section.alt}
                onChange={(alt) => patch({ alt })}
              />
              <LocalizedField
                label="Caption (optional)"
                value={section.caption}
                onChange={(caption) => patch({ caption })}
              />
            </>
          )}

          {section.type === "gallery" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="label-field !mb-0">Images ({section.images.length})</span>
                  <button
                    type="button"
                    className={CARD_BTN}
                    onClick={() => patch({ images: [...section.images, ""] })}
                  >
                    + Add image
                  </button>
                </div>
                <div className="space-y-2">
                  {section.images.map((src, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        className="admin-input"
                        dir="ltr"
                        value={src}
                        placeholder="https://…"
                        onChange={(e) =>
                          patch({
                            images: section.images.map((s, idx) =>
                              idx === i ? e.target.value : s,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        className={CARD_BTN}
                        onClick={() =>
                          patch({ images: section.images.filter((_, idx) => idx !== i) })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {section.images.length === 0 && (
                    <p className="text-xs text-muted uppercase font-heading">No images yet</p>
                  )}
                </div>
              </div>
              <LocalizedField
                label="Alt text (shared)"
                value={section.alt}
                onChange={(alt) => patch({ alt })}
              />
              <SelectField
                label="Columns"
                value={String(section.columns)}
                onChange={(columns) => patch({ columns: Number(columns) })}
                options={[
                  { value: "2", label: "2 columns" },
                  { value: "3", label: "3 columns" },
                  { value: "4", label: "4 columns" },
                ]}
              />
            </>
          )}

          {section.type === "faq" && (
            <>
              <LocalizedField
                label="Section title (optional)"
                value={section.title}
                onChange={(title) => patch({ title })}
              />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="label-field !mb-0">Questions ({section.items.length})</span>
                  <button
                    type="button"
                    className={CARD_BTN}
                    onClick={() =>
                      patch({
                        items: [
                          ...section.items,
                          {
                            id: newSectionId(),
                            question: emptyLocalized(),
                            answer: emptyLocalized(),
                          },
                        ],
                      })
                    }
                  >
                    + Add question
                  </button>
                </div>
                {section.items.map((item, i) => (
                  <div key={item.id} className="border border-line p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted uppercase font-heading">Q{i + 1}</span>
                      <button
                        type="button"
                        className={CARD_BTN}
                        onClick={() =>
                          patch({ items: section.items.filter((_, idx) => idx !== i) })
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <LocalizedField
                      label="Question"
                      value={item.question}
                      onChange={(question) =>
                        patch({
                          items: section.items.map((it, idx) =>
                            idx === i ? { ...it, question } : it,
                          ),
                        })
                      }
                    />
                    <LocalizedField
                      label="Answer"
                      value={item.answer}
                      multiline
                      onChange={(answer) =>
                        patch({
                          items: section.items.map((it, idx) =>
                            idx === i ? { ...it, answer } : it,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
                {section.items.length === 0 && (
                  <p className="text-xs text-muted uppercase font-heading">No questions yet</p>
                )}
              </div>
            </>
          )}

          {section.type === "products" && (
            <>
              <LocalizedField
                label="Section title (optional)"
                value={section.title}
                onChange={(title) => patch({ title })}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField
                  label="Category"
                  value={section.category_id}
                  onChange={(category_id) => patch({ category_id })}
                  options={[
                    { value: "", label: "All categories" },
                    ...categories.map((c) => ({ value: c.id, label: c.name_en || c.id })),
                  ]}
                />
                <div>
                  <label className="label-field">Max products (1–24)</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={1}
                    max={24}
                    value={section.limit}
                    onChange={(e) =>
                      patch({ limit: Math.max(1, Math.min(24, Number(e.target.value) || 8)) })
                    }
                  />
                </div>
              </div>
            </>
          )}

          {section.type === "cta" && (
            <>
              <LocalizedField
                label="Title"
                value={section.title}
                onChange={(title) => patch({ title })}
              />
              <LocalizedField
                label="Body text"
                value={section.body}
                onChange={(body) => patch({ body })}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <LocalizedField
                  label="Button label"
                  value={section.button_label}
                  onChange={(button_label) => patch({ button_label })}
                />
                <div>
                  <label className="label-field">Button link</label>
                  <input
                    className="admin-input"
                    dir="ltr"
                    value={section.button_link}
                    placeholder="/en/catalog or https://…"
                    onChange={(e) => patch({ button_link: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {section.type === "divider" && (
            <SelectField
              label="Style"
              value={section.style}
              onChange={(style) => patch({ style })}
              options={[
                { value: "line", label: "Simple line" },
                { value: "stamp", label: "Stamp (✦ EGYROCK ✦)" },
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
}
