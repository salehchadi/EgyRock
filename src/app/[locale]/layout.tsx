import React from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { fontAnton, fontOswald, fontCairo, fontAlmarai } from "../fonts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getCategories } from "@/lib/data/categories";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/components/providers/CartProvider";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  const isRtl = locale === "ar";

  // Categories are rendered inside the menu drawer (server-fetched via DAL).
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      className={`${fontAnton.variable} ${fontOswald.variable} ${fontCairo.variable} ${fontAlmarai.variable}`}
    >
      <body className="bg-canvas text-ink font-body min-h-screen antialiased selection:bg-brand selection:text-white flex flex-col justify-between">
        <ErrorBoundary>
          <AuthProvider>
            <NextIntlClientProvider messages={messages}>
              <CartProvider>
                <Header categories={categories} />
                <main className="flex-grow">{children}</main>
                <Footer />
              </CartProvider>
            </NextIntlClientProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
