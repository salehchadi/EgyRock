"use client";

import React, { useState } from "react";
import type { Product, Category } from "@/types";

interface Props {
  products: Product[];
  categories: Category[];
  locale: string;
}

const EMPTY_PRODUCT = {
  name_en: "",
  name_ar: "",
  name_fr: "",
  desc_en: "",
  desc_ar: "",
  desc_fr: "",
  price: 0,
  quantity: 0,
  category_id: "",
  images: "",
  // Wearables: comma-separated list (e.g. "S, M, L"). Empty = one-size product.
  sizes: "",
};

export default function AdminProductsClient({
  products: initialProducts,
  categories,
  locale,
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_PRODUCT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setForm({ ...EMPTY_PRODUCT, category_id: categories[0]?.id || "" });
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (p: Product) => {
    setForm({
      name_en: p.name_en,
      name_ar: p.name_ar,
      name_fr: p.name_fr,
      desc_en: p.desc_en,
      desc_ar: p.desc_ar,
      desc_fr: p.desc_fr,
      price: p.price,
      quantity: p.quantity,
      category_id: p.category_id,
      images: Array.isArray(p.images) ? p.images.join(", ") : p.images || "",
      sizes: Array.isArray(p.sizes) ? p.sizes.join(", ") : "",
    });
    setEditing(p);
    setCreating(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          quantity: Number(form.quantity),
          images: form.images
            ? form.images
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
          sizes: form.sizes
            ? String(form.sizes)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (editing) {
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? data.product : p)));
      } else {
        setProducts((prev) => [data.product, ...prev]);
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
    if (!confirm("Delete this product?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const catName = (id: string) => categories.find((c) => c.id === id)?.name_en || id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <a
            href={`/${locale}/admin`}
            className="text-xs text-muted hover:text-brand uppercase tracking-widest"
          >
            ← Admin
          </a>
          <h1 className="text-3xl font-heading uppercase text-ink mt-1">Products & Inventory</h1>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-brand hover:bg-brand-strong text-white font-heading uppercase text-sm tracking-wider border-2 border-black shadow-[3px_3px_0px_black] transition"
        >
          + Add Product
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
          <div className="bg-surface border-2 border-brand w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-[8px_8px_0_var(--color-brand)]">
            <h2 className="text-xl font-heading uppercase text-ink mb-4">
              {editing ? "Edit Product" : "New Product"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {["en", "ar", "fr"].map((lang) => (
                <div key={lang}>
                  <label className="label-field">Name ({lang.toUpperCase()})</label>
                  <input
                    className="admin-input"
                    name={`name_${lang}`}
                    value={form[`name_${lang}`]}
                    onChange={handleChange}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {["en", "ar", "fr"].map((lang) => (
                <div key={lang}>
                  <label className="label-field">Description ({lang.toUpperCase()})</label>
                  <textarea
                    className="admin-input"
                    rows={3}
                    name={`desc_${lang}`}
                    value={form[`desc_${lang}`]}
                    onChange={handleChange}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="label-field">Price (EGP)</label>
                <input
                  className="admin-input"
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label-field">Stock Qty</label>
                <input
                  className="admin-input"
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                />
              </div>
              <div className="col-span-2">
                <label className="label-field">Category</label>
                <select
                  className="admin-input"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="label-field">Image URLs (comma-separated)</label>
              <input
                className="admin-input"
                name="images"
                value={form.images}
                onChange={handleChange}
                placeholder="https://..., https://..."
              />
            </div>

            {/* Wearables only: sizes offered on the product page and cart */}
            <div className="mb-6">
              <label className="label-field">Sizes (comma-separated)</label>
              <input
                className="admin-input"
                name="sizes"
                value={form.sizes}
                onChange={handleChange}
                placeholder="S, M, L, XL — leave empty for one-size products"
              />
              <p className="mt-1.5 text-[11px] text-muted">
                Leave empty for accessories (mugs, picks, …). Customers must pick a size for
                products that list one.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={loading} className="admin-btn-primary">
                {loading ? "Saving..." : "Save Product"}
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

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-line text-xs uppercase tracking-wider text-muted">
              <th className="text-left py-3 pr-4">Product</th>
              <th className="text-left py-3 pr-4">Category</th>
              <th className="text-right py-3 pr-4">Price</th>
              <th className="text-right py-3 pr-4">Stock</th>
              <th className="text-left py-3 pr-4">Sizes</th>
              <th className="text-right py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line hover:bg-surface transition">
                <td className="py-3 pr-4">
                  <p className="font-bold text-ink">{p.name_en}</p>
                  <p className="text-xs text-muted">{p.id}</p>
                </td>
                <td className="py-3 pr-4 text-muted">{catName(p.category_id)}</td>
                <td className="py-3 pr-4 text-right text-ink">EGP {p.price}</td>
                <td className="py-3 pr-4 text-right">
                  <span
                    className={`font-bold ${p.quantity === 0 ? "text-danger" : p.quantity <= 5 ? "text-warning" : "text-success"}`}
                  >
                    {p.quantity}
                  </span>
                </td>
                <td className="py-3 pr-4 text-left text-xs text-muted">
                  {p.sizes && p.sizes.length > 0 ? p.sizes.join(", ") : "—"}
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
        {products.length === 0 && (
          <p className="text-center py-12 text-muted uppercase font-heading">
            No products yet. Add your first product above.
          </p>
        )}
      </div>
    </div>
  );
}
