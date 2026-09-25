"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";

export function SignOutButton() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  return (
    <button
      onClick={() => signOut({ callbackUrl: `/${locale}` })}
      className="px-4 py-2.5 bg-canvas hover:bg-surface-2 text-ink font-heading uppercase text-sm tracking-wider border border-line hover:border-danger hover:text-danger transition cursor-pointer"
    >
      {isArabic ? "تسجيل الخروج" : "SIGN OUT"}
    </button>
  );
}
