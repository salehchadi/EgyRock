import React from "react";
import { getPages } from "@/lib/data/pages";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function StorefrontPageIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = (["en", "ar", "fr"].includes(locale) ? locale : "en") as "en" | "ar" | "fr";

  const allPages = await getPages();
  const pages = allPages.filter((p) => p.is_published);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-4xl font-heading uppercase text-ink tracking-wide">Information</h1>
      <div className="h-1 w-16 bg-brand mt-3 mb-10" />

      <ul className="space-y-4">
        {pages.map((p) => (
          <li key={p.id}>
            <Link href={`/pages/${p.slug}`} className="underground-card block p-5 group">
              <span className="font-heading text-xl uppercase text-ink group-hover:text-brand transition">
                {p[`title_${lang}`] || p.title_en}
              </span>
              <span className="block text-xs text-muted mt-1 font-mono">/pages/{p.slug}</span>
            </Link>
          </li>
        ))}
      </ul>

      {pages.length === 0 && (
        <p className="text-muted uppercase font-heading">No pages published yet.</p>
      )}
    </div>
  );
}

export async function generateMetadata() {
  try {
    const allPages = await getPages();
    return {
      title: `EgyRock — Information (${allPages.filter((p) => p.is_published).length})`,
    };
  } catch {
    return { title: "EgyRock — Information" };
  }
}
