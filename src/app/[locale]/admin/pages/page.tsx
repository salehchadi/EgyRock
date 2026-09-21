import React from "react";
import { getPages } from "@/lib/data/pages";
import AdminPagesClient from "./AdminPagesClient";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const pages = await getPages();

  return <AdminPagesClient pages={pages} locale={locale} />;
}
