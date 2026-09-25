"use client";

import React from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onSelectChange(nextLocale: string) {
    router.replace({ pathname }, { locale: nextLocale });
  }

  const languages = [
    { code: "en", label: "EN", title: "English" },
    { code: "ar", label: "عربي", title: "العربية" },
    { code: "fr", label: "FR", title: "Français" },
  ];

  return (
    <div className="inline-flex items-center border-2 border-line bg-surface p-0.5 select-none shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
      {languages.map((lang) => {
        const isActive = locale === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => onSelectChange(lang.code)}
            title={lang.title}
            className={`px-2.5 py-1 text-xs uppercase transition cursor-pointer font-bold ${
              lang.code === "ar" ? "font-arabic-heading" : "font-heading"
            } ${
              isActive
                ? "bg-brand text-white shadow-[1px_1px_0px_black]"
                : "text-muted hover:text-ink hover:bg-surface-2"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
