"use client";

import React, { useState } from "react";
import type { StoreSettings } from "@/lib/data/settings";

interface Props {
  initialSettings: StoreSettings;
  locale: string;
}

export default function AdminSettingsClient({ initialSettings, locale }: Props) {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      setSettings(data.settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <a
          href={`/${locale}/admin`}
          className="text-xs text-muted hover:text-brand uppercase font-heading tracking-wider transition"
        >
          ← Back to dashboard
        </a>
        <h1 className="text-2xl sm:text-3xl uppercase text-ink font-heading mt-1">
          Store Settings
        </h1>
        <p className="text-xs text-muted mt-1">
          Configure payment details and store-wide settings.
        </p>
      </div>

      {error && (
        <div className="border-2 border-danger text-danger text-sm p-3 uppercase font-heading tracking-wide">
          {error}
        </div>
      )}

      {success && (
        <div className="border-2 border-success text-success text-sm p-3 uppercase font-heading tracking-wide">
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-surface border-2 border-line p-6 space-y-6">
        <div>
          <h2 className="text-lg uppercase text-ink font-heading mb-4 border-b border-line pb-2">
            InstaPay Payment Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label-field">InstaPay Username / Handle</label>
              <input
                type="text"
                name="instapay_handle"
                value={settings.instapay_handle || ""}
                onChange={handleChange}
                placeholder="egyrock@instapay"
                className="admin-input"
                required
              />
              <p className="text-[11px] text-muted mt-1">
                The account identifier displayed to customers on checkout and product pages.
              </p>
            </div>

            <div>
              <label className="label-field">InstaPay Payment Link / URL</label>
              <input
                type="url"
                name="instapay_link"
                value={settings.instapay_link || ""}
                onChange={handleChange}
                placeholder="https://ipn.eg/egyrock"
                className="admin-input"
              />
              <p className="text-[11px] text-muted mt-1">
                Optional link allowing customers to tap and open InstaPay directly on mobile.
              </p>
            </div>

            <div>
              <label className="label-field">InstaPay Phone Number</label>
              <input
                type="tel"
                name="instapay_phone"
                value={settings.instapay_phone || ""}
                onChange={handleChange}
                placeholder="010XXXXXXXX"
                className="admin-input"
              />
              <p className="text-[11px] text-muted mt-1">
                Alternative phone number for InstaPay wallet transfers.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-line">
          <button type="submit" disabled={loading} className="admin-btn-primary">
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
