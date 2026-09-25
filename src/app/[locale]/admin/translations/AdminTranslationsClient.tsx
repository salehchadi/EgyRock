"use client";

import React, { useMemo, useState } from "react";
import type { TranslationRecord } from "@/types";

interface Props {
  translations: TranslationRecord[];
  locale: string;
}

export default function AdminTranslationsClient({
  translations: initialTranslations,
  locale,
}: Props) {
  const [translations, setTranslations] = useState(initialTranslations);
  const [search, setSearch] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState({ en: "", ar: "", fr: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return translations;
    return translations.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        t.en.toLowerCase().includes(q) ||
        t.ar.includes(search.trim()) ||
        t.fr.toLowerCase().includes(q),
    );
  }, [translations, search]);

  const openEdit = (t: TranslationRecord) => {
    setEditingKey(t.key);
    setForm({ en: t.en, ar: t.ar, fr: t.fr });
    setError("");
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/translations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setTranslations((prev) =>
        prev.map((t) => (t.key === key ? { key, en: form.en, ar: form.ar, fr: form.fr } : t)),
      );
      setEditingKey(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div>
        <a
          href={`/${locale}/admin`}
          className="text-xs text-muted hover:text-brand uppercase tracking-widest"
        >
          ← Dashboard
        </a>
        <h1 className="text-3xl font-heading uppercase text-ink mt-1">Translations</h1>
        <p className="text-xs text-muted mt-1">
          {translations.length} keys — edit UI strings across EN / AR / FR without code.
        </p>
      </div>

      {/* Search */}
      <input
        className="admin-input max-w-md"
        placeholder="Search key or text…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && (
        <div className="p-3 bg-danger/15 border border-danger text-danger text-xs uppercase font-bold">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-line text-xs uppercase tracking-wider text-muted">
              <th className="text-left py-3 pr-4 w-56">Key</th>
              <th className="text-left py-3 pr-4">English</th>
              <th className="text-left py-3 pr-4">العربية</th>
              <th className="text-left py-3 pr-4">Français</th>
              <th className="text-right py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) =>
              editingKey === t.key ? (
                <tr key={t.key} className="border-b border-brand/50 bg-canvas">
                  <td className="py-2 pr-4 align-top">
                    <span className="font-mono text-xs text-brand">{t.key}</span>
                  </td>
                  <td className="py-2 pr-2 align-top">
                    <input
                      className="admin-input"
                      value={form.en}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          en: e.target.value,
                        }))
                      }
                      dir="ltr"
                    />
                  </td>
                  <td className="py-2 pr-2 align-top">
                    <input
                      className="admin-input"
                      value={form.ar}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          ar: e.target.value,
                        }))
                      }
                      dir="rtl"
                    />
                  </td>
                  <td className="py-2 pr-2 align-top">
                    <input
                      className="admin-input"
                      value={form.fr}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          fr: e.target.value,
                        }))
                      }
                      dir="ltr"
                    />
                  </td>
                  <td className="py-2 text-right align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSave(t.key)}
                        disabled={saving}
                        className="text-xs px-3 py-1.5 bg-brand hover:bg-brand-strong text-white uppercase font-heading tracking-wider border border-black transition disabled:opacity-50"
                      >
                        {saving ? "..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="text-xs px-3 py-1.5 border border-line text-muted hover:text-ink uppercase font-heading tracking-wider transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={t.key} className="border-b border-line hover:bg-surface transition">
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs text-muted">{t.key}</span>
                  </td>
                  <td className="py-3 pr-4 text-ink">{t.en || "—"}</td>
                  <td className="py-3 pr-4 text-ink" dir="rtl">
                    {t.ar || "—"}
                  </td>
                  <td className="py-3 pr-4 text-ink">{t.fr || "—"}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => openEdit(t)}
                      className="text-xs px-3 py-1.5 border border-line hover:border-brand text-ink uppercase font-heading tracking-wider transition"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-12 text-muted uppercase font-heading">
            No translation keys match your search.
          </p>
        )}
      </div>
    </div>
  );
}
