"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PosterBadge } from "@/components/ui/PosterBadge";

export default function StyleGuidePage() {
  const [isRtl, setIsRtl] = useState(false);

  /**
   * Palette swatches.
   * `token` is a variable from the single `@theme` block in src/app/globals.css —
   * the swatch colour is read from that variable, so changing the palette there
   * updates this guide too (no duplicated hex values here).
   */
  const colors = [
    { name: "Canvas", token: "--color-canvas", desc: "Page background (darkest base)" },
    { name: "Surface", token: "--color-surface", desc: "Cards, header, drawer panels" },
    { name: "Surface 2", token: "--color-surface-2", desc: "Hover states & popovers" },
    { name: "Sunken", token: "--color-sunken", desc: "Inset wells & image frames" },
    { name: "Ink", token: "--color-ink", desc: "Primary text & headers" },
    { name: "Ink Dim", token: "--color-ink-dim", desc: "Body copy on dark surfaces" },
    { name: "Muted", token: "--color-muted", desc: "Subtle labels & metadata" },
    { name: "Line", token: "--color-line", desc: "Poster rules & card borders" },
    { name: "Brand", token: "--color-brand", desc: "Rock energy, CTA, active elements" },
    { name: "Brand Strong", token: "--color-brand-strong", desc: "Accent hover / pressed" },
    { name: "Success", token: "--color-success", desc: "Poster-stamp: Available" },
    { name: "Warning", token: "--color-warning", desc: "Poster-stamp: Limited stock countdown" },
    { name: "Danger", token: "--color-danger", desc: "Poster-stamp: Depleted stock" },
  ];

  const sampleImages = [
    "/images/placeholders/egyrock-1.jpeg",
    "/images/placeholders/egyrock-2.jpeg",
    "/images/placeholders/egyrock-3.jpeg",
    "/images/placeholders/egyrock-5.jpeg",
  ];

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-canvas text-ink bg-screen-print py-12 px-4 sm:px-8"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Top Bar / Navigation */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-line pb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold block mb-1">
              Dev-Only Design System Review
            </span>
            <h1 className="text-4xl md:text-6xl font-heading tracking-tight text-ink">
              EGYROCK STYLE GUIDE
            </h1>
            <p className="text-muted mt-1 text-sm md:text-base font-body">
              Cairo Underground rock-poster & streetwear visual language
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRtl(!isRtl)}
              className="px-4 py-2 border-2 border-brand text-brand hover:bg-brand hover:text-white transition font-heading text-sm uppercase tracking-wider cursor-pointer"
            >
              Toggle Direction: {isRtl ? "RTL (Arabic)" : "LTR (Latin)"}
            </button>
            <Link
              href="/"
              className="px-4 py-2 border border-line hover:border-ink text-ink transition text-sm font-heading uppercase tracking-wider"
            >
              Back Home
            </Link>
          </div>
        </header>

        {/* Section 1: Color Palette */}
        <section className="space-y-6">
          <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-brand pl-4 rtl:pl-0 rtl:pr-4">
            <h2 className="text-2xl md:text-3xl font-heading uppercase tracking-wide">
              01 / COLOR TOKENS
            </h2>
            <p className="text-sm text-muted">
              Curated Egyptian underground palette. No generic pastel gradients or pure black.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {colors.map((c) => (
              <div
                key={c.token}
                className="bg-surface border border-line p-4 flex flex-col justify-between shadow-[3px_3px_0px_rgba(0,0,0,0.5)]"
              >
                <div
                  className="w-full h-16 border border-line mb-3 relative"
                  style={{ backgroundColor: `var(${c.token})` }}
                >
                  <span className="absolute bottom-1 right-1 text-[10px] px-1 bg-black/70 text-white font-mono uppercase">
                    {c.token}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-sm uppercase tracking-wider text-ink">
                    {c.name}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Typography */}
        <section className="space-y-6">
          <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-brand pl-4 rtl:pl-0 rtl:pr-4">
            <h2 className="text-2xl md:text-3xl font-heading uppercase tracking-wide">
              02 / TYPOGRAPHY PAIRINGS
            </h2>
            <p className="text-sm text-muted">
              Anton + Oswald for Latin; Cairo + Almarai for Arabic display & body.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Latin Typography */}
            <div className="bg-surface border-2 border-line p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-xs font-bold text-brand uppercase tracking-widest">
                  Latin Typography (Anton & Oswald)
                </span>
                <span className="text-xs text-muted">Default LTR</span>
              </div>
              <div>
                <span className="text-xs text-muted uppercase tracking-widest block mb-1">
                  Display Heading (Anton 400 condensed)
                </span>
                <p className="text-4xl md:text-5xl font-heading tracking-tight text-ink leading-none">
                  CAIRO ROCK UNDERGROUND
                </p>
              </div>
              <div>
                <span className="text-xs text-muted uppercase tracking-widest block mb-1">
                  Body & Metadata (Oswald 400-700)
                </span>
                <p className="text-ink font-body text-base leading-relaxed">
                  Screen-printed raw merch, physical guitar mastery kits, and indie festival
                  streetwear born from the alleyways of Downtown Cairo and Maadi.
                </p>
              </div>
              <div className="flex gap-4 pt-2">
                <span className="font-heading text-xl text-brand">450 EGP</span>
                <span className="font-body text-sm text-muted uppercase tracking-wider self-center">
                  LIMITED DROP #04
                </span>
              </div>
            </div>

            {/* Arabic Typography */}
            <div dir="rtl" className="bg-surface border-2 border-line p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-xs font-bold text-brand uppercase tracking-widest font-arabic-heading">
                  الخط العربي (كايرو والمراعي)
                </span>
                <span className="text-xs text-muted font-arabic-body">Arabic RTL</span>
              </div>
              <div>
                <span className="text-xs text-muted uppercase tracking-widest block mb-1 font-arabic-body">
                  العناوين الرئيسية (Cairo 800)
                </span>
                <p className="text-3xl md:text-4xl font-arabic-heading font-extrabold text-ink leading-tight">
                  موسيقى الروك والشارع المستقل في القاهرة
                </p>
              </div>
              <div>
                <span className="text-xs text-muted uppercase tracking-widest block mb-1 font-arabic-body">
                  النصوص والأوصاف (Almarai 400)
                </span>
                <p className="text-ink font-arabic-body text-base leading-relaxed">
                  منتجات أصلية مطبوعة بالشاشة الحريرية، حقائب دورات تدريبية واقعية ملموسة، وتيشيرتات
                  مستوحاة من بوسترات الحفلات المستقلة.
                </p>
              </div>
              <div className="flex gap-4 pt-2 items-center">
                <span className="font-arabic-heading font-bold text-xl text-brand">٤٥٠ ج.م</span>
                <span className="font-arabic-body text-sm text-muted">إصدار محدود للدفعة ٠٤</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Poster-Stamp Stock Badges */}
        <section className="space-y-6">
          <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-brand pl-4 rtl:pl-0 rtl:pr-4">
            <h2 className="text-2xl md:text-3xl font-heading uppercase tracking-wide">
              03 / POSTER-STAMP BADGES
            </h2>
            <p className="text-sm text-muted">
              Angled screen-printed stamp badges indicating live stock status across all 3 locales.
            </p>
          </div>

          <div className="bg-surface border-2 border-line p-6 space-y-8">
            <div>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
                English Badges (LTR)
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                <PosterBadge status="in_stock" locale="en" size="md" />
                <PosterBadge status="countdown" quantity={3} locale="en" size="md" />
                <PosterBadge status="out_of_stock" locale="en" size="md" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
                Arabic Badges (RTL)
              </h3>
              <div dir="rtl" className="flex flex-wrap items-center gap-6">
                <PosterBadge status="in_stock" locale="ar" size="md" />
                <PosterBadge status="countdown" quantity={3} locale="ar" size="md" />
                <PosterBadge status="out_of_stock" locale="ar" size="md" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
                French Badges (LTR)
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                <PosterBadge status="in_stock" locale="fr" size="md" />
                <PosterBadge status="countdown" quantity={4} locale="fr" size="md" />
                <PosterBadge status="out_of_stock" locale="fr" size="md" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
                Size Variants
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                <PosterBadge status="countdown" quantity={2} size="sm" />
                <PosterBadge status="countdown" quantity={2} size="md" />
                <PosterBadge status="countdown" quantity={2} size="lg" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Screen-Print Background Utility & Card Demo */}
        <section className="space-y-6">
          <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-brand pl-4 rtl:pl-0 rtl:pr-4">
            <h2 className="text-2xl md:text-3xl font-heading uppercase tracking-wide">
              04 / SCREEN-PRINT TEXTURE & PRODUCT CARDS
            </h2>
            <p className="text-sm text-muted">
              Pure CSS diagonal screen-print texture paired with real extracted placeholder assets.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleImages.map((src, i) => {
              const status =
                i === 0
                  ? "in_stock"
                  : i === 1
                    ? "countdown"
                    : i === 2
                      ? "out_of_stock"
                      : "in_stock";
              const isOut = status === "out_of_stock";

              return (
                <div
                  key={src}
                  className={`underground-card p-4 relative flex flex-col justify-between ${
                    isOut ? "opacity-60 grayscale-[40%]" : ""
                  }`}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-sunken border border-line mb-4">
                    <Image
                      src={src}
                      alt={`EgyRock Merch ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 z-10">
                      <PosterBadge status={status} quantity={i === 1 ? 2 : undefined} size="sm" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] text-brand uppercase font-bold tracking-widest block">
                      Category:{" "}
                      {i === 0
                        ? "T-Shirts"
                        : i === 1
                          ? "Courses"
                          : i === 2
                            ? "Mugs"
                            : "Accessories"}
                    </span>
                    <h4 className="font-heading text-lg uppercase text-ink leading-tight">
                      Cairo Underground Item #{i + 1}
                    </h4>
                    <p className="text-xs text-muted line-clamp-2 font-body">
                      Heavyweight physical merchandise featuring distressed rock screen-prints.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-line">
                      <span className="font-heading text-xl text-ink">{(i + 1) * 175} EGP</span>
                      <button
                        disabled={isOut}
                        className={`text-xs uppercase font-heading tracking-wider px-3 py-1.5 border ${
                          isOut
                            ? "border-line text-muted cursor-not-allowed"
                            : "border-brand text-brand hover:bg-brand hover:text-white cursor-pointer"
                        } transition`}
                      >
                        {isOut ? "Sold Out" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 5: Screen-Print Banner Showcase */}
        <section className="bg-screen-print-dense border-2 border-brand p-8 md:p-12 relative overflow-hidden shadow-[6px_6px_0px_var(--color-brand)]">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-brand bg-black/60 px-2 py-1 inline-block">
              Dense Screen-Print Texture Area
            </span>
            <h2 className="text-3xl md:text-5xl font-heading text-ink uppercase leading-none">
              RAW SOUNDS. HEAVY MERCH. CAIRO VIBES.
            </h2>
            <p className="text-sm md:text-base text-ink-dim font-body">
              Pure CSS diagonal screen-print texture creates an authentic gig poster aesthetic
              without heavy image downloads. All headings and badges hold their weight across Arabic
              and Latin.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
