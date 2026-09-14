"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { LocaleSwitcher } from "./LocaleSwitcher";

import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const t = useTranslations("nav");
  const brandT = useTranslations("brand");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#1c1a17]/95 backdrop-blur-md border-b-2 border-[#3f3b35] shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand / Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-2 text-[#f2ede4] hover:text-[#e0562c] transition"
            >
              <div className="w-9 h-9 bg-[#e0562c] border-2 border-[#f2ede4] flex items-center justify-center font-heading text-xl text-white transform -rotate-3 group-hover:rotate-0 transition-transform shadow-[2px_2px_0px_black]">
                ER
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-2xl tracking-wider font-extrabold uppercase leading-none ${
                    isArabic ? "font-arabic-heading text-xl" : "font-heading"
                  }`}
                >
                  {brandT("name")}
                </span>
                <span className="text-[10px] text-[#9e978e] tracking-widest uppercase mt-0.5">
                  Cairo Underground
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm uppercase transition hover:text-[#e0562c] tracking-wider text-[#f2ede4] ${
                isArabic ? "font-arabic-heading font-semibold" : "font-heading"
              }`}
            >
              {t("home")}
            </Link>
            <Link
              href="/catalog"
              className={`text-sm uppercase transition hover:text-[#e0562c] tracking-wider text-[#9e978e] hover:text-[#f2ede4] ${
                isArabic ? "font-arabic-heading font-semibold" : "font-heading"
              }`}
            >
              {t("catalog")}
            </Link>
            <Link
              href="/catalog?category=courses"
              className={`text-sm uppercase transition hover:text-[#e0562c] tracking-wider text-[#9e978e] hover:text-[#f2ede4] ${
                isArabic ? "font-arabic-heading font-semibold" : "font-heading"
              }`}
            >
              {t("courses")}
            </Link>
            <Link
              href="/style-guide"
              className={`text-xs uppercase px-2 py-0.5 border border-[#3f3b35] text-[#e0562c] hover:border-[#e0562c] tracking-wider ${
                isArabic ? "font-arabic-heading" : "font-heading"
              }`}
            >
              {t("styleGuide")}
            </Link>
          </nav>

          {/* Right Action Area (Locale Switcher, Account, Cart) */}
          <div className="flex items-center gap-3 sm:gap-4">
            <LocaleSwitcher />

            {/* Account / Auth link */}
            {session?.user ? (
              <div className="flex items-center gap-2">
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-block px-2.5 py-1 bg-[#e0562c] text-white text-xs font-heading uppercase tracking-wider shadow-[2px_2px_0px_black] hover:bg-[#c44721] transition"
                  >
                    ADMIN
                  </Link>
                )}
                <Link
                  href="/account"
                  className="px-3 py-1.5 border border-[#3f3b35] bg-[#282521] hover:border-[#e0562c] text-xs font-heading uppercase tracking-wider text-[#f2ede4] transition flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-[#2ea043]" />
                  <span className="max-w-[100px] truncate">{user.name || "Account"}</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-3 py-1.5 border border-[#3f3b35] hover:border-[#e0562c] text-xs font-heading uppercase tracking-wider text-[#f2ede4] hover:text-[#e0562c] transition"
              >
                {isArabic ? "دخول" : "SIGN IN"}
              </Link>
            )}

            {/* Cart Icon / Trigger */}
            <Link
              href="/cart"
              className="relative p-2 border border-[#3f3b35] bg-[#282521] hover:border-[#e0562c] text-[#f2ede4] transition flex items-center gap-2 group shadow-[2px_2px_0px_rgba(0,0,0,0.5)]"
              aria-label="Cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 group-hover:text-[#e0562c] transition"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <span className="bg-[#e0562c] text-white text-xs font-heading font-bold px-1.5 py-0.2 rounded-none">
                0
              </span>
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 border border-[#3f3b35] text-[#f2ede4] hover:border-[#e0562c]"
              aria-label="Toggle Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-[#3f3b35] space-y-3">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-heading uppercase text-[#f2ede4] hover:text-[#e0562c]"
            >
              {t("home")}
            </Link>
            <Link
              href="/catalog"
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-heading uppercase text-[#9e978e] hover:text-[#e0562c]"
            >
              {t("catalog")}
            </Link>
            <Link
              href="/catalog?category=courses"
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-heading uppercase text-[#9e978e] hover:text-[#e0562c]"
            >
              {t("courses")}
            </Link>
            <Link
              href="/style-guide"
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-heading uppercase text-[#e0562c]"
            >
              {t("styleGuide")}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
