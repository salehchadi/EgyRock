import React from "react";
import { getHomepageImages } from "@/lib/data/homepageImages";
import AdminHeroClient from "./AdminHeroClient";

export const dynamic = "force-dynamic";

export default async function AdminHeroPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const images = await getHomepageImages();

  return <AdminHeroClient images={images} locale={locale} />;
}
