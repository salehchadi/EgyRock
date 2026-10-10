import React from "react";
import { getSettings } from "@/lib/data/settings";
import AdminSettingsClient from "./AdminSettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settings = await getSettings();

  return <AdminSettingsClient initialSettings={settings} locale={locale} />;
}
