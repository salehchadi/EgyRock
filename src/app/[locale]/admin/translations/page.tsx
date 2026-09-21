import React from "react";
import { getTranslations } from "@/lib/data/translations";
import AdminTranslationsClient from "./AdminTranslationsClient";

export const dynamic = "force-dynamic";

export default async function AdminTranslationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const translations = await getTranslations();

  return <AdminTranslationsClient translations={translations} locale={locale} />;
}
