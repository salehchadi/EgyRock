"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useCart } from "@/components/providers/CartProvider";
import { useSession } from "next-auth/react";
import type { Category } from "@/types";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

/**
 * Slide-in navigation drawer.
 * Opens from the LEFT in LTR locales (en/fr) and from the RIGHT in RTL (ar).
 * Categories are listed with expandable/collapsible sub-categories.
 */
export function MenuDrawer({ open, onClose, categories }: MenuDrawerProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const { totalItems } = useCart();
  const t = useTranslations("nav");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleCategory = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const catName = (c: Category) =>
    isArabic ? c.name_ar || c.name_en : locale === "fr" ? c.name_fr || c.name_en : c.name_en;

  // Top-level categories have no parent; sub-categories hang off their parent.
  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const linkClass = () =>
    `block w-full text-start px-4 py-3 text-sm uppercase tracking-wider border-b border-line transition ${
      isArabic ? "font-arabic-heading font-semibold" : "font-heading"
    } text-ink hover:text-brand hover:bg-surface`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Menu">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

      {/* Drawer panel — left in LTR, right in RTL */}
      <nav
        data-testid="menu-drawer-panel"
        className={`absolute top-0 bottom-0 w-[82%] max-w-sm bg-canvas border-line shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col ${
          isArabic ? "right-0 border-s-2 slide-in-right" : "left-0 border-e-2 slide-in-left"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b-2 border-line bg-sunken">
          <span
            className={`text-lg tracking-wider text-brand ${
              isArabic ? "font-arabic-heading font-bold" : "font-heading"
            }`}
          >
            {isArabic ? "القائمة" : locale === "fr" ? "Menu" : "MENU"}
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 border border-line text-ink hover:border-brand hover:text-brand transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Primary links */}
          <Link href="/" onClick={onClose} className={linkClass()}>
            {t("home")}
          </Link>
          <Link href="/catalog" onClick={onClose} className={linkClass()}>
            {t("catalog")}
          </Link>

          {/* Categories with expandable sub-categories */}
          <div className="px-4 pt-5 pb-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted">
              {isArabic ? "الأقسام" : locale === "fr" ? "Catégories" : "Categories"}
            </span>
          </div>

          {topLevel.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted uppercase">
              {isArabic ? "لا توجد أقسام" : "No categories yet"}
            </p>
          )}

          {topLevel.map((cat) => {
            const children = childrenOf(cat.id);
            const isOpen = expanded[cat.id] || false;

            return (
              <div key={cat.id} className="border-b border-line">
                <div className="flex items-stretch">
                  <Link
                    href={`/catalog?category=${cat.id}`}
                    onClick={onClose}
                    className={`flex-1 px-4 py-3 text-sm uppercase tracking-wider text-ink hover:text-brand hover:bg-surface transition ${
                      isArabic ? "font-arabic-heading font-semibold" : "font-heading"
                    }`}
                  >
                    {catName(cat)}
                  </Link>

                  {children.length > 0 && (
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      aria-expanded={isOpen}
                      aria-label={isArabic ? `توسيع ${catName(cat)}` : `Expand ${catName(cat)}`}
                      className="px-4 border-s border-line text-muted hover:text-brand hover:bg-surface transition"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Sub-categories (expandable / collapsible) */}
                {children.length > 0 && isOpen && (
                  <div className="bg-sunken border-t border-line">
                    {children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/catalog?category=${sub.id}`}
                        onClick={onClose}
                        className={`block px-8 py-2.5 text-sm text-ink-dim hover:text-brand hover:bg-surface transition border-b border-line/50 last:border-b-0 ${
                          isArabic ? "font-arabic-body" : "font-body"
                        }`}
                      >
                        {catName(sub)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Account section */}
          <div className="px-4 pt-5 pb-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted">
              {isArabic ? "الحساب" : locale === "fr" ? "Compte" : "Account"}
            </span>
          </div>

          <Link href="/cart" onClick={onClose} className={linkClass()}>
            {t("cart")} ({totalItems})
          </Link>

          {session?.user ? (
            <>
              <Link href="/account" onClick={onClose} className={linkClass()}>
                {t("account")}
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" onClick={onClose} className={linkClass()}>
                  {t("admin")}
                </Link>
              )}
            </>
          ) : (
            <Link href="/auth/login" onClick={onClose} className={linkClass()}>
              {isArabic ? "دخول" : locale === "fr" ? "Connexion" : "Sign In"}
            </Link>
          )}

          <Link href="/style-guide" onClick={onClose} className={linkClass()}>
            {t("styleGuide")}
          </Link>

          {/* Language switcher */}
          <div className="p-4 border-t border-line mt-4">
            <span className="block text-[10px] uppercase tracking-widest text-muted mb-2">
              {isArabic ? "اللغة" : locale === "fr" ? "Langue" : "Language"}
            </span>
            <LocaleSwitcher />
          </div>
        </div>
      </nav>
    </div>
  );
}
