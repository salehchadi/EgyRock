"use client";

import React, { useState } from "react";
import type { Category } from "@/types";

interface Props {
  categories: Category[];
  locale: string;
}

const EMPTY_CATEGORY = {
  name_en: "",
  name_ar: "",
  name_fr: "",
  parent_id: "",
};

export default function AdminCategoriesClient({ categories: initialCategories, locale }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_CATEGORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setForm({ ...EMPTY_CATEGORY });
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (c: Category) => {
    setForm({
      name_en: c.name_en,
      name_ar: c.name_ar,
      name_fr: c.name_fr,
      parent_id: c.parent_id || "",
    });
    setEditing(c);
    setCreating(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (editing) {
        setCategories((prev) => prev.map((c) => (c.id === editing.id ? data.category : c)));
      } else {
        setCategories((prev) => [data.category, ...prev]);
      }
      setEditing(null);
      setCreating(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products in it will become uncategorized.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message || "Delete failed");
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
            className="text-xs text-muted hover:text-brand uppercase tracking-widest"
          >
            ← Dashboard
          </a>
          <h1 className="text-3xl font-heading uppercase text-ink mt-1">Categories</h1>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-brand hover:bg-brand-strong text-white font-heading uppercase text-sm tracking-wider border-2 border-black shadow-[3px_3px_0px_black] transition"
        >
          + Add Category
        </button>
      </div>

      {error && (
        <div className="p-3 bg-danger/15 border border-danger text-danger text-xs uppercase font-bold">
          {error}
        </div>
      )}

      {/* Modal Form */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-surface border-2 border-brand w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-[8px_8px_0_var(--color-brand)]">
            <h2 className="text-xl font-heading uppercase text-ink mb-4">
              {editing ? "Edit Category" : "New Category"}
            </h2>

            <div className="space-y-4 mb-6">
              {["en", "ar", "fr"].map((lang) => (
                <div key={lang}>
                  <label className="label-field">Name ({lang.toUpperCase()})</label>
                  <input
                    className="admin-input"
                    name={`name_${lang}`}
                    value={form[`name_${lang}`]}
                    onChange={handleChange}
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    placeholder={`Category name in ${lang.toUpperCase()}`}
                  />
                </div>
              ))}
            </div>

            {/* Sub-category support: choose a parent category (empty = top level) */}
            <div className="mb-6">
              <label className="label-field">Parent Category</label>
              <select
                className="admin-input"
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
              >
                <option value="">— None (top-level category) —</option>
                {categories
                  .filter((c) => !c.parent_id && c.id !== editing?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_en}
                    </option>
                  ))}
              </select>
              <p className="mt-1.5 text-[11px] text-muted">
                Pick a parent to create a sub-category — it appears nested inside that category in
                the storefront menu drawer.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={loading} className="admin-btn-primary">
                {loading ? "Saving..." : "Save Category"}
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setCreating(false);
                }}
                className="admin-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-line text-xs uppercase tracking-wider text-muted">
              <th className="text-left py-3 pr-4">ID</th>
              <th className="text-left py-3 pr-4">English</th>
              <th className="text-left py-3 pr-4">Arabic</th>
              <th className="text-left py-3 pr-4">French</th>
              <th className="text-left py-3 pr-4">Parent</th>
              <th className="text-right py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-line hover:bg-surface transition">
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs text-muted">{c.id}</span>
                </td>
                <td className="py-3 pr-4 text-ink font-bold">{c.name_en}</td>
                <td className="py-3 pr-4 text-ink" dir="rtl">
                  {c.name_ar}
                </td>
                <td className="py-3 pr-4 text-ink">{c.name_fr}</td>
                <td className="py-3 pr-4 text-xs text-muted">
                  {c.parent_id
                    ? categories.find((p) => p.id === c.parent_id)?.name_en || c.parent_id
                    : "— Top level"}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-xs px-3 py-1.5 border border-line hover:border-brand text-ink uppercase font-heading tracking-wider transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
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
        {categories.length === 0 && (
          <p className="text-center py-12 text-muted uppercase font-heading">
            No categories yet. Add your first category above.
          </p>
        )}
      </div>
    </div>
  );
}
