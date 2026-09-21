import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageBySlug } from "@/lib/data/pages";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ locale: string; slug: string }>;

function resolveLang(locale: string): "en" | "ar" | "fr" {
  return (["en", "ar", "fr"].includes(locale) ? locale : "en") as "en" | "ar" | "fr";
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = resolveLang(locale);
  try {
    const page = await getPageBySlug(slug);
    if (page) {
      return { title: page[`title_${lang}`] || page.title_en };
    }
  } catch {
    // DB unreachable — fall through to default title
  }
  return { title: "EgyRock" };
}

export default async function StorefrontCustomPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  const lang = resolveLang(locale);

  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const title = page[`title_${lang}`] || page.title_en;
  const content = page[`content_${lang}`] || page.content_en;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1
        className={`text-4xl uppercase text-[#f2ede4] tracking-wide ${
          lang === "ar" ? "font-arabic-heading" : "font-heading"
        }`}
      >
        {title}
      </h1>
      <div className="h-1 w-16 bg-[#e0562c] mt-3 mb-10" />
      <div
        className={`text-[#c5beaf] leading-relaxed whitespace-pre-wrap ${
          lang === "ar" ? "font-arabic-body" : ""
        }`}
        dir={lang === "ar" ? "rtl" : undefined}
      >
        {content || "—"}
      </div>
    </article>
  );
}
