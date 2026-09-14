"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { HomepageImage } from "@/types";
import { PosterBadge } from "@/components/ui/PosterBadge";

interface HeroCarouselProps {
  slides: HomepageImage[];
  locale: string;
}

export function HeroCarousel({ slides, locale }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const total = slides.length;
  const isArabic = locale === "ar";

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % (total || 1));
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % (total || 1));
  }, [total]);

  // Auto-advance timer (5s)
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide]);

  if (!slides || slides.length === 0) {
    return null;
  }

  const activeSlide = slides[current] || slides[0];
  const slideTitle = isArabic
    ? activeSlide.title_ar || activeSlide.title_en || "صخب الروك في وسط البلد"
    : activeSlide.title_en || "DISTORTION IN DOWNTOWN CAIRO";

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative bg-screen-print border-b-2 border-[#3f3b35] py-12 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-[inset_0_-20px_30px_rgba(0,0,0,0.6)]"
      aria-label="Hero Carousel"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
        {/* Left / Text Side */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#e0562c] bg-[#282521] border border-[#e0562c] px-3 py-1 shadow-[2px_2px_0px_#e0562c]">
              {isArabic ? `عرض رقم ٠${current + 1}` : `UNDERGROUND DROP #0${current + 1}`}
            </span>
            <PosterBadge status="countdown" quantity={3} locale={locale} size="sm" />
          </div>

          <h1
            className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase text-[#f2ede4] leading-[0.95] tracking-tight transition-all duration-300 ${
              isArabic ? "font-arabic-heading" : "font-heading"
            }`}
          >
            {slideTitle}
          </h1>

          <p
            className={`text-base sm:text-lg text-[#c5beaf] max-w-2xl leading-relaxed ${
              isArabic ? "font-arabic-body" : "font-body"
            }`}
          >
            {isArabic
              ? "منتجات أصلية مطبوعة بالشاشة الحريرية، حقائب دورات تعليمية واقعية ملموسة، وملابس روك مستوحاة من أزقة القاهرة ومسارحها المستقلة."
              : "Raw screen-printed band merch, physical guitar mastery boxes, and heavyweight Egyptian streetwear. All physical items shipped directly to your door."}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {activeSlide.link_url ? (
              <Link
                href={activeSlide.link_url}
                className="px-6 py-3.5 bg-[#e0562c] hover:bg-[#c44721] text-white font-heading uppercase text-sm sm:text-base tracking-wider transition border-2 border-black shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_black]"
              >
                {isArabic ? "تصفح هذا الإصدار" : "EXPLORE THIS DROP"}
              </Link>
            ) : (
              <Link
                href="/catalog"
                className="px-6 py-3.5 bg-[#e0562c] hover:bg-[#c44721] text-white font-heading uppercase text-sm sm:text-base tracking-wider transition border-2 border-black shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_black]"
              >
                {isArabic ? "تصفح الكتالوج" : "SHOP CATALOG"}
              </Link>
            )}

            <Link
              href="/catalog?category=courses"
              className="px-6 py-3.5 bg-[#282521] hover:bg-[#332f2a] text-[#f2ede4] font-heading uppercase text-sm sm:text-base tracking-wider transition border-2 border-[#3f3b35] hover:border-[#f2ede4] shadow-[4px_4px_0px_rgba(0,0,0,0.5)]"
            >
              {isArabic ? "الدورات الملموسة" : "PHYSICAL COURSES"}
            </Link>
          </div>

          {/* Slide Navigation Controls & Indicators */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                aria-label="Previous Slide"
                className="p-2 bg-[#282521] hover:bg-[#e0562c] text-[#f2ede4] border border-[#3f3b35] hover:border-[#e0562c] transition shadow-[2px_2px_0px_black] cursor-pointer"
              >
                <svg
                  className="w-4 h-4 rtl:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                aria-label="Next Slide"
                className="p-2 bg-[#282521] hover:bg-[#e0562c] text-[#f2ede4] border border-[#3f3b35] hover:border-[#e0562c] transition shadow-[2px_2px_0px_black] cursor-pointer"
              >
                <svg
                  className="w-4 h-4 rtl:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center gap-2">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 transition-all cursor-pointer ${
                    current === idx
                      ? "w-8 bg-[#e0562c] border border-black"
                      : "w-2 bg-[#3f3b35] hover:bg-[#9e978e]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right / Visual Banner Carousel Display */}
        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[4/3] sm:aspect-square w-full max-w-md mx-auto border-2 border-[#e0562c] bg-[#282521] p-3 shadow-[8px_8px_0px_#e0562c]">
            <div className="relative w-full h-full overflow-hidden bg-black">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <Image
                    src={slide.image_url}
                    alt={slide.title_en || "EgyRock Hero Banner"}
                    fill
                    priority={idx === 0}
                    className="object-cover"
                  />
                </div>
              ))}
              <div className="absolute bottom-3 left-3 rtl:left-auto rtl:right-3 z-20">
                <span className="text-[10px] font-mono uppercase bg-black/80 text-[#e0562c] px-2 py-1 border border-[#e0562c]">
                  ROTATING HERO #{current + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
