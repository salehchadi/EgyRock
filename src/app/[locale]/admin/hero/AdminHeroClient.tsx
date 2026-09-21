"use client";

import React, { useState } from "react";
import type { HomepageImage } from "@/types";

interface Props {
  images: HomepageImage[];
  locale: string;
}

const EMPTY_FORM = {
  image_url: "",
  link_url: "",
  title_en: "",
  title_ar: "",
  sort_order: 1,
};

export default function AdminHeroClient({ images: initialImages, locale }: Props) {
  const [images, setImages] = useState(initialImages);
  const [editing, setEditing] = useState<HomepageImage | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, sort_order: images.length + 1 });
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (img: HomepageImage) => {
    setForm({
      image_url: img.image_url,
      link_url: img.link_url || "",
      title_en: img.title_en || "",
      title_ar: img.title_ar || "",
      sort_order: img.sort_order,
    });
    setEditing(img);
    setCreating(false);
  };

  const handleClose = () => {
    setEditing(null);
    setCreating(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f: any) => ({
      ...f,
      [name]: name === "sort_order" ? Number(value) || 1 : value,
    }));
  };

  const handleSave = async () => {
    if (!form.image_url.trim()) {
      setError("Image URL is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/admin/hero/${editing.id}` : "/api/admin/hero";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      if (editing) {
        setImages((prev) =>
          prev
            .map((img) => (img.id === editing.id ? data.image : img))
            .sort((a, b) => a.sort_order - b.sort_order),
        );
      } else {
        setImages((prev) => [...prev, data.image].sort((a, b) => a.sort_order - b.sort_order));
      }
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this hero slide?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/hero/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setImages((prev) => prev.filter((img) => img.id !== id));
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
          <h1 className="text-3xl font-heading uppercase text-[#f2ede4] mt-1">Homepage Hero</h1>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-[#e0562c] hover:bg-[#c44721] text-white font-heading uppercase text-sm tracking-wider border-2 border-black shadow-[3px_3px_0px_black] transition"
        >
          + Add Slide
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
          <div className="bg-[#282521] border-2 border-[#e0562c] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-[8px_8px_0_#e0562c]">
            <h2 className="text-xl font-heading uppercase text-[#f2ede4] mb-4">
              {editing ? "Edit Slide" : "New Slide"}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="label-field">Image URL *</label>
                <input
                  className="admin-input"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="/images/hero/banner.jpg or https://..."
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label-field">Link URL (optional)</label>
                <input
                  className="admin-input"
                  name="link_url"
                  value={form.link_url}
                  onChange={handleChange}
                  placeholder="/catalog/t-shirts"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label-field">Headline (EN, optional)</label>
                <input
                  className="admin-input"
                  name="title_en"
                  value={form.title_en}
                  onChange={handleChange}
                  placeholder="NEW DROP — SUMMER 26"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="label-field">Headline (AR, optional)</label>
                <input
                  className="admin-input"
                  name="title_ar"
                  value={form.title_ar}
                  onChange={handleChange}
                  placeholder="عرض جديد"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="label-field">Sort Order (1 = first)</label>
                <input
                  className="admin-input"
                  name="sort_order"
                  type="number"
                  min={1}
                  value={form.sort_order}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={loading} className="admin-btn-primary">
                {loading ? "Saving..." : "Save Slide"}
              </button>
              <button onClick={handleClose} className="admin-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slides List — sorted by sort_order */}
      <div className="space-y-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="underground-card border-2 !border-[#3f3b35] p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
          >
            <div className="w-full sm:w-40 h-24 flex-shrink-0 bg-[#1c1a17] border border-[#3f3b35] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.title_en || "Hero slide"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="admin-status-pending">#{img.sort_order}</span>
                <span className="font-heading text-sm uppercase text-[#f2ede4] truncate">
                  {img.title_en || "(no headline)"}
                </span>
              </div>
              {img.title_ar && (
                <p className="text-xs text-[#9e978e]" dir="rtl">
                  {img.title_ar}
                </p>
              )}
              <p className="text-xs text-[#9e978e] truncate font-mono" dir="ltr">
                {img.image_url}
              </p>
              {img.link_url && (
                <p className="text-xs text-[#e0562c] truncate font-mono" dir="ltr">
                  → {img.link_url}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => openEdit(img)}
                className="text-xs px-3 py-1.5 border border-[#3f3b35] hover:border-[#e0562c] text-[#f2ede4] uppercase font-heading tracking-wider transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(img.id)}
                className="text-xs px-3 py-1.5 border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626]/10 uppercase font-heading tracking-wider transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {images.length === 0 && (
          <p className="text-center py-12 text-[#9e978e] uppercase font-heading">
            No hero slides yet. Add your first slide above.
          </p>
        )}
      </div>
    </div>
  );
}
