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
      className="px-4 py-2.5 bg-[#1c1a17] hover:bg-[#332f2a] text-[#f2ede4] font-heading uppercase text-sm tracking-wider border border-[#3f3b35] hover:border-[#dc2626] hover:text-[#dc2626] transition cursor-pointer"
    >
      {isArabic ? "تسجيل الخروج" : "SIGN OUT"}
    </button>
  );
}
