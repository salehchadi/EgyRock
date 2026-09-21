import React from "react";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getPages } from "@/lib/data/pages";
import type { CustomPage } from "@/types";

export async function Footer() {
  const t = await getTranslations("footer");
  const brandT = await getTranslations("brand");
  const locale = await getLocale();
  const lang = (["en", "ar", "fr"].includes(locale) ? locale : "en") as "en" | "ar" | "fr";

  // Dynamic footer links from the admin-managed Pages sheet (DB-connected).
  let publishedPages: CustomPage[] = [];
  try {
    publishedPages = (await getPages()).filter((p) => p.is_published);
  } catch {
    // DB unreachable — footer still renders with static links
    publishedPages = [];
  }

  return (
    <footer className="border-t-2 border-[#3f3b35] bg-[#141210] py-12 px-4 sm:px-6 lg:px-8 text-[#9e978e] text-sm">
      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3 items-start">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="font-heading text-xl text-[#f2ede4] tracking-wider uppercase">
            {brandT("name")}
          </span>
          <span className="text-xs px-2 py-0.5 border border-[#3f3b35] text-[#e0562c]">
            {brandT("tagline")}
          </span>
        </div>

        {/* Dynamic page links from DB */}
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs uppercase font-heading tracking-wider">
          <Link href="/catalog" className="hover:text-[#f2ede4] transition">
            Catalog
          </Link>
          {publishedPages.map((p) => (
            <Link key={p.id} href={`/pages/${p.slug}`} className="hover:text-[#e0562c] transition">
              {p[`title_${lang}`] || p.title_en}
            </Link>
          ))}
        </nav>

        {/* Legal / payment notice */}
        <div className="text-center md:text-end text-xs space-y-1">
          <p>{t("copyright")}</p>
          <p className="text-[#e0562c]">{t("instapayNotice")}</p>
        </div>
      </div>
    </footer>
  );
}
