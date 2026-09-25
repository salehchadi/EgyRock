"use client";

import React, { useState } from "react";
import Image from "next/image";

interface ProductImageGalleryProps {
  images: string[];
  title: string;
}

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = images[activeIndex] || images[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-sunken border-2 border-line shadow-[6px_6px_0px_var(--color-brand)]">
        <Image
          src={activeImage}
          alt={title}
          fill
          className="object-cover transition-all duration-300"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 rtl:right-auto rtl:left-3 bg-black/70 border border-line px-2.5 py-1 text-xs font-mono text-ink">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        {/* Prev/Next Arrows (only when multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
              className="absolute left-2 rtl:left-auto rtl:right-2 top-1/2 -translate-y-1/2 bg-black/60 border border-line p-2 text-ink hover:bg-brand hover:border-brand transition cursor-pointer"
              aria-label="Previous image"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="rtl:rotate-180"
              >
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
              className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 -translate-y-1/2 bg-black/60 border border-line p-2 text-ink hover:bg-brand hover:border-brand transition cursor-pointer"
              aria-label="Next image"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="rtl:rotate-180"
              >
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden border-2 transition cursor-pointer ${
                idx === activeIndex
                  ? "border-brand shadow-[2px_2px_0px_var(--color-brand)]"
                  : "border-line hover:border-muted opacity-60 hover:opacity-100"
              }`}
              aria-label={`View image ${idx + 1}`}
            >
              <Image
                src={img}
                alt={`${title} - ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
