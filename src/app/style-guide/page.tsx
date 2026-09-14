"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PosterBadge } from "@/components/ui/PosterBadge";

export default function StyleGuidePage() {
  const [isRtl, setIsRtl] = useState(false);

  const colors = [
    {
      name: "Charcoal Base",
      hex: "#1c1a17",
      variable: "--color-charcoal-base",
      desc: "Main dark canvas",
    },
    {
      name: "Charcoal Card",
      hex: "#282521",
      variable: "--color-charcoal-card",
      desc: "Surface containers & cards",
    },
    {
      name: "Charcoal Elevated",
      hex: "#332f2a",
      variable: "--color-charcoal-elevated",
      desc: "Hover states & popovers",
    },
    {
      name: "Bone White",
      hex: "#f2ede4",
      variable: "--color-bone-text",
      desc: "Primary text & headers",
    },
    {
      name: "Ash Gray",
      hex: "#9e978e",
      variable: "--color-ash-muted",
      desc: "Subtle labels & secondary text",
    },
    {
      name: "Gritty Border",
      hex: "#3f3b35",
      variable: "--color-border-gritty",
      desc: "Poster rules & card borders",
    },
    {
      name: "Coral Accent",
      hex: "#e0562c",
      variable: "--color-coral-accent",
      desc: "Rock energy, CTA, active elements",
    },
    {
      name: "In-Stock Green",
      hex: "#2ea043",
      variable: "--color-stock-in",
      desc: "Poster-stamp: Available",
    },
    {
      name: "Countdown Amber",
      hex: "#d97706",
      variable: "--color-stock-countdown",
      desc: "Poster-stamp: Limited stock countdown",
    },
    {
      name: "Out-of-Stock Red",
      hex: "#dc2626",
      variable: "--color-stock-out",
      desc: "Poster-stamp: Depleted stock",
    },
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
      className="min-h-screen bg-[#1c1a17] text-[#f2ede4] bg-screen-print py-12 px-4 sm:px-8"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Top Bar / Navigation */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#3f3b35] pb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#e0562c] font-bold block mb-1">
              Dev-Only Design System Review
            </span>
            <h1 className="text-4xl md:text-6xl font-heading tracking-tight text-[#f2ede4]">
              EGYROCK STYLE GUIDE
            </h1>
            <p className="text-[#9e978e] mt-1 text-sm md:text-base font-body">
              Cairo Underground rock-poster & streetwear visual language
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRtl(!isRtl)}
              className="px-4 py-2 border-2 border-[#e0562c] text-[#e0562c] hover:bg-[#e0562c] hover:text-white transition font-heading text-sm uppercase tracking-wider cursor-pointer"
            >
              Toggle Direction: {isRtl ? "RTL (Arabic)" : "LTR (Latin)"}
            </button>
            <Link
              href="/"
              className="px-4 py-2 border border-[#3f3b35] hover:border-[#f2ede4] text-[#f2ede4] transition text-sm font-heading uppercase tracking-wider"
            >
              Back Home
            </Link>
          </div>
        </header>

        {/* Section 1: Color Palette */}
        <section className="space-y-6">
          <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#e0562c] pl-4 rtl:pl-0 rtl:pr-4">
            <h2 className="text-2xl md:text-3xl font-heading uppercase tracking-wide">
              01 / COLOR TOKENS
            </h2>
            <p className="text-sm text-[#9e978e]">
              Curated Egyptian underground palette. No generic pastel gradients or pure black.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {colors.map((c) => (
              <div
                key={c.hex}
                className="bg-[#282521] border border-[#3f3b35] p-4 flex flex-col justify-between shadow-[3px_3px_0px_rgba(0,0,0,0.5)]"
              >
                <div
                  className="w-full h-16 border border-[#3f3b35] mb-3 relative"
                  style={{ backgroundColor: c.hex }}
                >
                  <span className="absolute bottom-1 right-1 text-[10px] px-1 bg-black/70 text-white font-mono uppercase">
                    {c.hex}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-sm uppercase tracking-wider text-[#f2ede4]">
                    {c.name}
                  </h3>
                  <p className="text-xs text-[#9e978e] mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Typography */}
        <section className="space-y-6">
          <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#e0562c] pl-4 rtl:pl-0 rtl:pr-4">
            <h2 className="text-2xl md:text-3xl font-heading uppercase tracking-wide">
              02 / TYPOGRAPHY PAIRINGS
            </h2>
            <p className="text-sm text-[#9e978e]">
              Anton + Oswald for Latin; Cairo + Almarai for Arabic display & body.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Latin Typography */}
            <div className="bg-[#282521] border-2 border-[#3f3b35] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#3f3b35] pb-2">
                <span className="text-xs font-bold text-[#e0562c] uppercase tracking-widest">
                  Latin Typography (Anton & Oswald)
                </span>
                <span className="text-xs text-[#9e978e]">Default LTR</span>
              </div>
              <div>
                <span className="text-xs text-[#9e978e] uppercase tracking-widest block mb-1">
                  Display Heading (Anton 400 condensed)
                </span>
                <p className="text-4xl md:text-5xl font-heading tracking-tight text-[#f2ede4] leading-none">
                  CAIRO ROCK UNDERGROUND
                </p>
              </div>
              <div>
                <span className="text-xs text-[#9e978e] uppercase tracking-widest block mb-1">
                  Body & Metadata (Oswald 400-700)
                </span>
                <p className="text-[#f2ede4] font-body text-base leading-relaxed">
                  Screen-printed raw merch, physical guitar mastery kits, and indie festival
                  streetwear born from the alleyways of Downtown Cairo and Maadi.
                </p>
              </div>
              <div className="flex gap-4 pt-2">
                <span className="font-heading text-xl text-[#e0562c]">450 EGP</span>
                <span className="font-body text-sm text-[#9e978e] uppercase tracking-wider self-center">
                  LIMITED DROP #04
                </span>
              </div>
            </div>

            {/* Arabic Typography */}
            <div dir="rtl" className="bg-[#282521] border-2 border-[#3f3b35] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#3f3b35] pb-2">
                <span className="text-xs font-bold text-[#e0562c] uppercase tracking-widest font-arabic-heading">
                  الخط العربي (كايرو والمراعي)
                </span>
                <span className="text-xs text-[#9e978e] font-arabic-body">Arabic RTL</span>
              </div>
              <div>
                <span className="text-xs text-[#9e978e] uppercase tracking-widest block mb-1 font-arabic-body">
                  العناوين الرئيسية (Cairo 800)
                </span>
                <p className="text-3xl md:text-4xl font-arabic-heading font-extrabold text-[#f2ede4] leading-tight">
                  موسيقى الروك والشارع المستقل في القاهرة
                </p>
              </div>
              <div>
                <span className="text-xs text-[#9e978e] uppercase tracking-widest block mb-1 font-arabic-body">
                  النصوص والأوصاف (Almarai 400)
                </span>
                <p className="text-[#f2ede4] font-arabic-body text-base leading-relaxed">
                  منتجات أصلية مطبوعة بالشاشة الحريرية، حقائب دورات تدريبية واقعية ملموسة، وتيشيرتات
                  مستوحاة من بوسترات الحفلات المستقلة.
                </p>
              </div>
              <div className="flex gap-4 pt-2 items-center">
                <span className="font-arabic-heading font-bold text-xl text-[#e0562c]">
                  ٤٥٠ ج.م
                </span>
                <span className="font-arabic-body text-sm text-[#9e978e]">
                  إصدار محدود للدفعة ٠٤
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Poster-Stamp Stock Badges */}
        <section className="space-y-6">
          <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#e0562c] pl-4 rtl:pl-0 rtl:pr-4">
            <h2 className="text-2xl md:text-3xl font-heading uppercase tracking-wide">
              03 / POSTER-STAMP BADGES
            </h2>
            <p className="text-sm text-[#9e978e]">
              Angled screen-printed stamp badges indicating live stock status across all 3 locales.
            </p>
          </div>

          <div className="bg-[#282521] border-2 border-[#3f3b35] p-6 space-y-8">
            <div>
              <h3 className="text-xs font-bold text-[#9e978e] uppercase tracking-widest mb-4">
                English Badges (LTR)
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                <PosterBadge status="in_stock" locale="en" size="md" />
                <PosterBadge status="countdown" quantity={3} locale="en" size="md" />
                <PosterBadge status="out_of_stock" locale="en" size="md" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#9e978e] uppercase tracking-widest mb-4">
                Arabic Badges (RTL)
              </h3>
              <div dir="rtl" className="flex flex-wrap items-center gap-6">
                <PosterBadge status="in_stock" locale="ar" size="md" />
                <PosterBadge status="countdown" quantity={3} locale="ar" size="md" />
                <PosterBadge status="out_of_stock" locale="ar" size="md" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#9e978e] uppercase tracking-widest mb-4">
                French Badges (LTR)
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                <PosterBadge status="in_stock" locale="fr" size="md" />
                <PosterBadge status="countdown" quantity={4} locale="fr" size="md" />
                <PosterBadge status="out_of_stock" locale="fr" size="md" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#9e978e] uppercase tracking-widest mb-4">
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
          <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#e0562c] pl-4 rtl:pl-0 rtl:pr-4">
            <h2 className="text-2xl md:text-3xl font-heading uppercase tracking-wide">
              04 / SCREEN-PRINT TEXTURE & PRODUCT CARDS
            </h2>
            <p className="text-sm text-[#9e978e]">
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
                  <div className="relative aspect-square w-full overflow-hidden bg-[#141210] border border-[#3f3b35] mb-4">
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
                    <span className="text-[11px] text-[#e0562c] uppercase font-bold tracking-widest block">
                      Category:{" "}
                      {i === 0
                        ? "T-Shirts"
                        : i === 1
                          ? "Courses"
                          : i === 2
                            ? "Mugs"
                            : "Accessories"}
                    </span>
                    <h4 className="font-heading text-lg uppercase text-[#f2ede4] leading-tight">
                      Cairo Underground Item #{i + 1}
                    </h4>
                    <p className="text-xs text-[#9e978e] line-clamp-2 font-body">
                      Heavyweight physical merchandise featuring distressed rock screen-prints.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-[#3f3b35]">
                      <span className="font-heading text-xl text-[#f2ede4]">
                        {(i + 1) * 175} EGP
                      </span>
                      <button
                        disabled={isOut}
                        className={`text-xs uppercase font-heading tracking-wider px-3 py-1.5 border ${
                          isOut
                            ? "border-[#3f3b35] text-[#9e978e] cursor-not-allowed"
                            : "border-[#e0562c] text-[#e0562c] hover:bg-[#e0562c] hover:text-white cursor-pointer"
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
        <section className="bg-screen-print-dense border-2 border-[#e0562c] p-8 md:p-12 relative overflow-hidden shadow-[6px_6px_0px_#e0562c]">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#e0562c] bg-black/60 px-2 py-1 inline-block">
              Dense Screen-Print Texture Area
            </span>
            <h2 className="text-3xl md:text-5xl font-heading text-[#f2ede4] uppercase leading-none">
              RAW SOUNDS. HEAVY MERCH. CAIRO VIBES.
            </h2>
            <p className="text-sm md:text-base text-[#c5beaf] font-body">
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
