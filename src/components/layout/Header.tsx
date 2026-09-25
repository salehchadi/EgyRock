"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MenuDrawer } from "./MenuDrawer";
import { useCart } from "@/components/providers/CartProvider";
import type { Category } from "@/types";

import { useSession } from "next-auth/react";

interface HeaderProps {
  categories?: Category[];
}

export function Header({ categories = [] }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const { totalItems } = useCart();
  const brandT = useTranslations("brand");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock page scroll while the drawer is open.
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-canvas/95 backdrop-blur-md border-b-2 border-line shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 h-14 sm:h-20">
            {/* Brand / Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href="/"
                className="group flex items-center gap-2 min-w-0 text-ink hover:text-brand transition"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 bg-brand border-2 border-ink flex items-center justify-center font-heading text-base sm:text-xl text-white transform -rotate-3 group-hover:rotate-0 transition-transform shadow-[2px_2px_0px_black]">
                  ER
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-base sm:text-2xl tracking-wider font-extrabold uppercase leading-none ${
                      isArabic ? "font-arabic-heading sm:text-xl" : "font-heading"
                    }`}
                  >
                    {brandT("name")}
                  </span>
                  <span className="hidden sm:block text-[10px] text-muted tracking-widest uppercase mt-0.5">
                    Cairo Underground
                  </span>
                </div>
              </Link>
            </div>

            {/* Right Action Area (Locale Switcher, Account, Cart, Menu) */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {/* Locale switcher — hidden on phones, available inside the drawer */}
              <div className="hidden sm:block">
                <LocaleSwitcher />
              </div>

              {/* Account / Auth link */}
              {session?.user ? (
                <div className="flex items-center gap-2">
                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="hidden sm:inline-block px-2.5 py-1 bg-brand text-white text-xs font-heading uppercase tracking-wider shadow-[2px_2px_0px_black] hover:bg-brand-strong transition"
                    >
                      ADMIN
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="hidden sm:flex px-3 py-1.5 border border-line bg-surface hover:border-brand text-xs font-heading uppercase tracking-wider text-ink transition items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span className="max-w-[100px] truncate">{user.name || "Account"}</span>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-block px-3 py-1.5 border border-line hover:border-brand text-xs font-heading uppercase tracking-wider text-ink hover:text-brand transition"
                >
                  {isArabic ? "دخول" : "SIGN IN"}
                </Link>
              )}

              {/* Cart Icon (shopping cart, not a bag) */}
              <Link
                href="/cart"
                className="relative p-2 sm:p-2.5 border border-line bg-surface hover:border-brand text-ink transition flex items-center group shadow-[2px_2px_0px_rgba(0,0,0,0.5)]"
                aria-label="Cart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-brand transition"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -end-2 bg-brand text-white text-xs font-heading font-bold px-1.5 min-w-[20px] text-center rounded-none animate-pulse">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Menu trigger — opens the drawer (left in LTR, right in RTL) */}
              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 border border-line bg-surface text-ink hover:border-brand hover:text-brand transition"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-in navigation drawer */}
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} />
    </>
  );
}
