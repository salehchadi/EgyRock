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

  const navT = await getTranslations("nav");

  // Dynamic footer links from the admin-managed Pages sheet (DB-connected).
  let publishedPages: CustomPage[] = [];
  try {
    publishedPages = (await getPages()).filter((p) => p.is_published);
  } catch {
    // DB unreachable — footer still renders with static links
    publishedPages = [];
  }

  return (
    <footer className="border-t-2 border-line bg-sunken py-12 px-4 sm:px-6 lg:px-8 text-muted text-sm">
      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3 items-start">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="font-heading text-xl text-ink tracking-wider uppercase">
            {brandT("name")}
          </span>
          <span className="text-xs px-2 py-0.5 border border-line text-brand">
            {brandT("tagline")}
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs uppercase tracking-wider font-medium">
          <Link href="/catalog" className="hover:text-ink transition">
            {navT("catalog")}
          </Link>
          <Link href="/pages/how-to-pay" className="hover:text-ink transition">
            {navT("howToPay")}
          </Link>
          <Link href="/pages/about" className="hover:text-ink transition">
            {navT("about")}
          </Link>
          {publishedPages.map((p) => (
            <Link key={p.id} href={`/pages/${p.slug}`} className="hover:text-brand transition">
              {p[`title_${lang}`] || p.title_en}
            </Link>
          ))}
        </nav>

        {/* Legal / payment notice */}
        <div className="text-center md:text-end text-xs space-y-1">
          <p>{t("copyright")}</p>
          <p className="text-brand">{t("instapayNotice")}</p>
        </div>
      </div>
    </footer>
  );
}
