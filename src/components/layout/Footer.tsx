import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");
  const brandT = useTranslations("brand");

  return (
    <footer className="border-t-2 border-[#3f3b35] bg-[#141210] py-12 px-4 sm:px-6 lg:px-8 text-[#9e978e] text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="font-heading text-xl text-[#f2ede4] tracking-wider uppercase">
            {brandT("name")}
          </span>
          <span className="text-xs px-2 py-0.5 border border-[#3f3b35] text-[#e0562c]">
            {brandT("tagline")}
          </span>
        </div>

        <div className="text-center md:text-start text-xs space-y-1">
          <p>{t("copyright")}</p>
          <p className="text-[#e0562c]">{t("instapayNotice")}</p>
        </div>

        <div className="flex items-center gap-4 text-xs uppercase font-heading tracking-wider">
          <Link href="/catalog" className="hover:text-[#f2ede4] transition">
            Catalog
          </Link>
          <Link href="/style-guide" className="hover:text-[#f2ede4] transition">
            Style Guide
          </Link>
        </div>
      </div>
    </footer>
  );
}
