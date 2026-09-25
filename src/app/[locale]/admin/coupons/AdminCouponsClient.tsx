"use client";

import React, { useState } from "react";
import type { Coupon, CouponType } from "@/types";

interface Props {
  coupons: Coupon[];
  locale: string;
}

const EMPTY_COUPON = {
  code: "",
  type: "percent" as CouponType,
  value: "",
  min_order: "0",
  active: true,
  usage_limit: "0",
  expires_at: "",
};

export default function AdminCouponsClient({ coupons: initialCoupons, locale }: Props) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_COUPON);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setForm({ ...EMPTY_COUPON });
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      min_order: String(c.min_order),
      active: c.active,
      usage_limit: String(c.usage_limit),
      expires_at: c.expires_at || "",
    });
    setEditing(c);
    setCreating(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((f: any) => ({
      ...f,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          min_order: Number(form.min_order) || 0,
          active: form.active !== false,
          usage_limit: Number(form.usage_limit) || 0,
          expires_at: form.expires_at || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (editing) {
        setCoupons((prev) => prev.map((c) => (c.id === editing.id ? data.coupon : c)));
      } else {
        setCoupons((prev) => [data.coupon, ...prev]);
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
    if (!confirm("Delete this coupon?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? data.coupon : x)));
    } catch (err: any) {
      setError(err.message);
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
          <h1 className="text-3xl font-heading uppercase text-ink mt-1">Coupons</h1>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-brand hover:bg-brand-strong text-white font-heading uppercase text-sm tracking-wider border-2 border-black shadow-[3px_3px_0px_black] transition"
        >
          + Add Coupon
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
              {editing ? "Edit Coupon" : "New Coupon"}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="label-field">Code</label>
                <input
                  className="admin-input uppercase"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. ROCK10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Type</label>
                  <select
                    className="admin-input"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed (EGP)</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">
                    Value {form.type === "percent" ? "(%)" : "(EGP)"}
                  </label>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    step="0.01"
                    name="value"
                    value={form.value}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Min Order (EGP)</label>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    step="0.01"
                    name="min_order"
                    value={form.min_order}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="label-field">Usage Limit (0 = ∞)</label>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    name="usage_limit"
                    value={form.usage_limit}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="label-field">Expires At</label>
                <input
                  className="admin-input"
                  type="date"
                  name="expires_at"
                  value={form.expires_at ? String(form.expires_at).slice(0, 10) : ""}
                  onChange={handleChange}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active !== false}
                  onChange={handleChange}
                  className="w-4 h-4 accent-brand"
                />
                <span className="uppercase text-xs font-bold tracking-wider">Active</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={loading} className="admin-btn-primary">
                {loading ? "Saving..." : "Save Coupon"}
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

      {/* Coupons Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-line text-xs uppercase tracking-wider text-muted">
              <th className="text-left py-3 pr-4">Code</th>
              <th className="text-left py-3 pr-4">Discount</th>
              <th className="text-left py-3 pr-4">Min Order</th>
              <th className="text-left py-3 pr-4">Usage</th>
              <th className="text-left py-3 pr-4">Expires</th>
              <th className="text-left py-3 pr-4">Status</th>
              <th className="text-right py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-line hover:bg-surface transition">
                <td className="py-3 pr-4 font-mono text-xs text-brand font-bold">{c.code}</td>
                <td className="py-3 pr-4 text-ink">
                  {c.type === "percent" ? `${c.value}%` : `EGP ${c.value}`}
                </td>
                <td className="py-3 pr-4 text-muted">
                  {c.min_order > 0 ? `EGP ${c.min_order}` : "—"}
                </td>
                <td className="py-3 pr-4 text-muted">
                  {c.used_count}
                  {c.usage_limit > 0 ? ` / ${c.usage_limit}` : " / ∞"}
                </td>
                <td className="py-3 pr-4 text-muted text-xs">
                  {c.expires_at ? String(c.expires_at).slice(0, 10) : "—"}
                </td>
                <td className="py-3 pr-4">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`text-xs px-2.5 py-1 border-2 uppercase font-heading tracking-wider transition ${
                      c.active
                        ? "border-success text-success hover:bg-success/10"
                        : "border-muted text-muted hover:bg-muted/10"
                    }`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
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
        {coupons.length === 0 && (
          <p className="text-center py-12 text-muted uppercase font-heading">
            No coupons yet. Add your first coupon above.
          </p>
        )}
      </div>
    </div>
  );
}
