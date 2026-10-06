"use client";

import React, { useState } from "react";
import type { Category, CustomPage, PageSection, PageSettings, Product } from "@/types";
import {
  createSection,
  DEFAULT_PAGE_SETTINGS,
  duplicateSectionAt,
  moveSection,
  removeSectionAt,
  SECTION_LABELS,
  SECTION_TYPES,
  serializeSections,
  serializeSettings,
} from "@/lib/pageSections";
import SectionEditor from "./SectionEditor";
import { PageRenderer } from "@/components/pages/PageRenderer";

/* ================================================================
   AdminPagesClient — page list + section-based page builder.
   Pages with `sections` render on the storefront via PageRenderer;
   the same component powers the live preview below the editor.
   ================================================================ */

interface Props {
  pages: CustomPage[];
  categories: Category[];
  products: Product[];
  locale: string;
}

interface PageForm {
  slug: string;
  title_en: string;
  title_ar: string;
  title_fr: string;
  content_en: string;
  content_ar: string;
  content_fr: string;
  is_published: boolean;
  sections: PageSection[];
  settings: PageSettings;
}

const EMPTY_FORM: PageForm = {
  slug: "",
  title_en: "",
  title_ar: "",
  title_fr: "",
  content_en: "",
  content_ar: "",
  content_fr: "",
  is_published: false,
  sections: [],
  settings: { ...DEFAULT_PAGE_SETTINGS },
};

export default function AdminPagesClient({
  pages: initialPages,
  categories,
  products,
  locale,
}: Props) {
  const [pages, setPages] = useState(initialPages);
  const [editing, setEditing] = useState<CustomPage | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<PageForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const builderOpen = creating || editing !== null;

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, settings: { ...DEFAULT_PAGE_SETTINGS } });
    setCreating(true);
    setEditing(null);
    setShowPreview(false);
    setError("");
  };

  const openEdit = (p: CustomPage) => {
    setForm({
      slug: p.slug,
      title_en: p.title_en,
      title_ar: p.title_ar,
      title_fr: p.title_fr,
      content_en: p.content_en,
      content_ar: p.content_ar,
      content_fr: p.content_fr,
      is_published: p.is_published,
      sections: p.sections || [],
      settings: p.settings ? { ...p.settings } : { ...DEFAULT_PAGE_SETTINGS },
    });
    setEditing(p);
    setCreating(false);
    setShowPreview(false);
    setError("");
  };

  const handleClose = () => {
    setEditing(null);
    setCreating(false);
    setError("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((f) => ({ ...f, [target.name]: value }));
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((f) => ({
      ...f,
      settings: { ...f.settings, [target.name]: value } as PageSettings,
    }));
  };

  const handleAddSection = (type: (typeof SECTION_TYPES)[number]) => {
    setForm((f) => ({ ...f, sections: [...f.sections, createSection(type)] }));
    setShowPreview(false);
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.title_en.trim()) {
      setError("Slug and English title are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Surface the Sheets cell-size cap in the admin before hitting the API.
      serializeSections(form.sections);
      serializeSettings(form.settings);

      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/admin/pages/${editing.id}` : "/api/admin/pages";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      if (editing) {
        setPages((prev) => prev.map((p) => (p.id === editing.id ? data.page : p)));
      } else {
        setPages((prev) => [data.page, ...prev]);
      }
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this page? It will be removed from the storefront.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <a
            href={`/${locale}/admin`}
            className="text-xs text-muted hover:text-brand uppercase font-heading tracking-wider transition"
          >
            ← Back to dashboard
          </a>
          <h1 className="text-2xl sm:text-3xl uppercase text-ink font-heading mt-1">
            Pages / Builder
          </h1>
        </div>
        {!builderOpen && (
          <button onClick={openCreate} className="admin-btn-primary">
            + New Page
          </button>
        )}
      </div>

      {error && (
        <div className="border-2 border-danger text-danger text-sm p-3 uppercase font-heading tracking-wide break-words">
          {error}
        </div>
      )}

      {/* ============ BUILDER (create / edit) ============ */}
      {builderOpen && (
        <div className="space-y-6">
          {/* Page settings */}
          <div className="underground-card border-2 !border-line p-4 space-y-4">
            <h2 className="font-heading text-sm uppercase text-brand tracking-wider">
              Page settings
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label-field">Content width</label>
                <select
                  className="admin-input"
                  name="width"
                  value={form.settings.width}
                  onChange={handleSettingsChange}
                >
                  <option value="narrow">Narrow</option>
                  <option value="wide">Wide</option>
                  <option value="full">Full</option>
                </select>
              </div>
              <div>
                <label className="label-field">Background</label>
                <select
                  className="admin-input"
                  name="background"
                  value={form.settings.background}
                  onChange={handleSettingsChange}
                >
                  <option value="default">Default (canvas)</option>
                  <option value="surface">Surface</option>
                  <option value="sunken">Sunken</option>
                  <option value="brand-tint">Brand tint</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    name="show_title"
                    checked={form.settings.show_title}
                    onChange={handleSettingsChange}
                    className="accent-[var(--color-brand)]"
                  />
                  Show page title (H1)
                </label>
              </div>
            </div>
          </div>

          {/* Page meta */}
          <div className="underground-card border-2 !border-line p-4 space-y-4">
            <h2 className="font-heading text-sm uppercase text-brand tracking-wider">
              Page details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Slug (URL)</label>
                <input
                  className="admin-input"
                  name="slug"
                  value={form.slug}
                  dir="ltr"
                  placeholder="my-page"
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_published"
                    checked={form.is_published}
                    onChange={handleChange}
                    className="accent-[var(--color-brand)]"
                  />
                  Published (visible on storefront)
                </label>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {(["en", "ar", "fr"] as const).map((lang) => (
                <div key={lang}>
                  <label className="label-field">Title ({lang.toUpperCase()})</label>
                  <input
                    className="admin-input"
                    name={`title_${lang}`}
                    value={form[`title_${lang}`]}
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    onChange={handleChange}
                  />
                </div>
              ))}
            </div>
            <details className="border border-line">
              <summary className="cursor-pointer p-3 text-xs uppercase font-heading tracking-wider text-muted hover:text-ink">
                Legacy text body (only used when the page has no sections)
              </summary>
              <div className="p-3 pt-0 grid sm:grid-cols-3 gap-4">
                {(["en", "ar", "fr"] as const).map((lang) => (
                  <div key={lang}>
                    <label className="label-field">Content ({lang.toUpperCase()})</label>
                    <textarea
                      className="admin-input min-h-[120px]"
                      name={`content_${lang}`}
                      value={form[`content_${lang}`]}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      onChange={handleChange}
                    />
                  </div>
                ))}
              </div>
            </details>
          </div>

          {/* Sections */}
          <div className="underground-card border-2 !border-line p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm uppercase text-brand tracking-wider">
                Sections: {form.sections.length}
              </h2>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="admin-btn-secondary"
              >
                {showPreview ? "Hide preview" : "Preview"}
              </button>
            </div>

            <div className="space-y-3">
              {form.sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  index={index}
                  total={form.sections.length}
                  categories={categories}
                  onChange={(next) =>
                    setForm((f) => ({
                      ...f,
                      sections: f.sections.map((s) => (s.id === section.id ? next : s)),
                    }))
                  }
                  onMove={(delta) =>
                    setForm((f) => ({ ...f, sections: moveSection(f.sections, index, delta) }))
                  }
                  onDuplicate={() =>
                    setForm((f) => ({ ...f, sections: duplicateSectionAt(f.sections, index) }))
                  }
                  onDelete={() =>
                    setForm((f) => ({ ...f, sections: removeSectionAt(f.sections, index) }))
                  }
                />
              ))}
              {form.sections.length === 0 && (
                <p className="text-center py-8 text-muted uppercase font-heading">
                  No sections yet — add your first block below. (Pages without sections use the
                  legacy text body.)
                </p>
              )}
            </div>

            {/* Add-section picker */}
            <div className="border-t border-line pt-4">
              <span className="label-field">Add section</span>
              <div className="flex flex-wrap gap-2">
                {SECTION_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddSection(type)}
                    className="text-xs px-3 py-1.5 border border-line hover:border-brand hover:text-brand text-ink uppercase font-heading tracking-wider transition"
                  >
                    + {SECTION_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live preview (same renderer as the storefront) */}
          {showPreview && (
            <div className="border-2 border-dashed border-line">
              <div className="px-4 py-2 border-b border-line bg-surface text-xs uppercase font-heading tracking-wider text-muted">
                Live preview ({locale}) — drafts stay hidden from the storefront
              </div>
              <PageRenderer
                title={{ en: form.title_en, ar: form.title_ar, fr: form.title_fr }}
                sections={form.sections}
                settings={form.settings}
                locale={locale}
                products={products}
              />
            </div>
          )}

          {/* Save / cancel */}
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={loading} className="admin-btn-primary">
              {loading ? "Saving..." : "Save Page"}
            </button>
            <button onClick={handleClose} className="admin-btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pages Table */}
      {!builderOpen && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-line text-xs uppercase tracking-wider text-muted">
                <th className="text-left py-3 pr-4">Slug</th>
                <th className="text-left py-3 pr-4">Title (EN)</th>
                <th className="text-left py-3 pr-4">Title (AR)</th>
                <th className="text-left py-3 pr-4">Sections</th>
                <th className="text-left py-3 pr-4">Status</th>
                <th className="text-right py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-b border-line hover:bg-surface transition">
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs text-brand">/pages/{p.slug}</span>
                  </td>
                  <td className="py-3 pr-4 text-ink font-bold">{p.title_en}</td>
                  <td className="py-3 pr-4 text-ink" dir="rtl">
                    {p.title_ar || "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {p.sections && p.sections.length > 0 ? (
                      <span className="admin-status-confirmed">
                        {p.sections.length} block{p.sections.length === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="text-xs text-muted uppercase font-heading">Legacy</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {p.is_published ? (
                      <span className="admin-status-confirmed">Published</span>
                    ) : (
                      <span className="admin-status-pending">Draft</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs px-3 py-1.5 border border-line hover:border-brand text-ink uppercase font-heading tracking-wider transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs px-3 py-1.5 border border-danger text-danger hover:bg-danger/10 uppercase font-heading tracking-wider transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages.length === 0 && (
            <p className="text-center py-12 text-muted uppercase font-heading">
              No pages yet. Add your first page above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
