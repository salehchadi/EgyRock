"use client";

import React, { useState } from "react";
import type { CustomPage } from "@/types";

interface Props {
  pages: CustomPage[];
  locale: string;
}

const EMPTY_FORM = {
  slug: "",
  title_en: "",
  title_ar: "",
  title_fr: "",
  content_en: "",
  content_ar: "",
  content_fr: "",
  is_published: false,
};

export default function AdminPagesClient({ pages: initialPages, locale }: Props) {
  const [pages, setPages] = useState(initialPages);
  const [editing, setEditing] = useState<CustomPage | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setCreating(true);
    setEditing(null);
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
    });
    setEditing(p);
    setCreating(false);
  };

  const handleClose = () => {
    setEditing(null);
    setCreating(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as any;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((f: any) => ({ ...f, [target.name]: value }));
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.title_en.trim()) {
      setError("Slug and English title are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
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
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: "DELETE",
      });
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
            className="text-xs text-[#9e978e] hover:text-[#e0562c] uppercase tracking-widest"
          >
            ← Dashboard
          </a>
          <h1 className="text-3xl font-heading uppercase text-[#f2ede4] mt-1">Dynamic Pages</h1>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-[#e0562c] hover:bg-[#c44721] text-white font-heading uppercase text-sm tracking-wider border-2 border-black shadow-[3px_3px_0px_black] transition"
        >
          + Add Page
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#dc2626]/15 border border-[#dc2626] text-[#dc2626] text-xs uppercase font-bold">
          {error}
        </div>
      )}

      {/* Modal Form */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#282521] border-2 border-[#e0562c] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-[8px_8px_0_#e0562c]">
            <h2 className="text-xl font-heading uppercase text-[#f2ede4] mb-4">
              {editing ? "Edit Page" : "New Page"}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Slug * (URL: /p/your-slug)</label>
                  <input
                    className="admin-input"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="about"
                    dir="ltr"
                    disabled={Boolean(editing)}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={form.is_published}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#e0562c]"
                    />
                    <span className="text-xs uppercase font-heading tracking-wider text-[#f2ede4]">
                      Published
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {["en", "ar", "fr"].map((lang) => (
                  <div key={lang}>
                    <label className="label-field">
                      Title ({lang.toUpperCase()}){lang === "en" ? " *" : ""}
                    </label>
                    <input
                      className="admin-input"
                      name={`title_${lang}`}
                      value={form[`title_${lang}`]}
                      onChange={handleChange}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                    />
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {["en", "ar", "fr"].map((lang) => (
                  <div key={lang}>
                    <label className="label-field">Content ({lang.toUpperCase()})</label>
                    <textarea
                      className="admin-input min-h-[140px]"
                      name={`content_${lang}`}
                      value={form[`content_${lang}`]}
                      onChange={handleChange}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={loading} className="admin-btn-primary">
                {loading ? "Saving..." : "Save Page"}
              </button>
              <button onClick={handleClose} className="admin-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pages Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[#3f3b35] text-xs uppercase tracking-wider text-[#9e978e]">
              <th className="text-left py-3 pr-4">Slug</th>
              <th className="text-left py-3 pr-4">Title (EN)</th>
              <th className="text-left py-3 pr-4">Title (AR)</th>
              <th className="text-left py-3 pr-4">Status</th>
              <th className="text-right py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-[#3f3b35] hover:bg-[#282521] transition">
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs text-[#e0562c]">/p/{p.slug}</span>
                </td>
                <td className="py-3 pr-4 text-[#f2ede4] font-bold">{p.title_en}</td>
                <td className="py-3 pr-4 text-[#f2ede4]" dir="rtl">
                  {p.title_ar || "—"}
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
                      className="text-xs px-3 py-1.5 border border-[#3f3b35] hover:border-[#e0562c] text-[#f2ede4] uppercase font-heading tracking-wider transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs px-3 py-1.5 border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626]/10 uppercase font-heading tracking-wider transition"
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
          <p className="text-center py-12 text-[#9e978e] uppercase font-heading">
            No pages yet. Add your first page above.
          </p>
        )}
      </div>
    </div>
  );
}
