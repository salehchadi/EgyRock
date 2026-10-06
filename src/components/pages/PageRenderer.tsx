"use client";

import React from "react";
import Link from "next/link";
import type { LocalizedText, PageSection, PageSettings, Product } from "@/types";
import { normalizeSections, normalizeSettings, pickLocalized } from "@/lib/pageSections";
import { ProductCard } from "@/components/catalog/ProductCard";

/* ================================================================
   PageRenderer — storefront renderer for section-based custom pages.
   Shared with the admin builder preview (client component), so both
   render exactly the same markup. Cairo Underground styling only:
   charcoal/coral tokens, poster-stamp borders, Anton/Oswald + Cairo.
   ================================================================ */

interface PageRendererProps {
  title: LocalizedText;
  sections: PageSection[];
  /** Raw settings from the sheet cell — normalized defensively here. */
  settings?: Partial<PageSettings> | null;
  locale: string;
  /** Product catalog for `products` sections (fetched server-side). */
  products?: Product[];
}

function resolveLang(locale: string): "en" | "ar" | "fr" {
  return locale === "ar" || locale === "fr" ? locale : "en";
}

const WIDTH_CLASSES: Record<PageSettings["width"], string> = {
  narrow: "max-w-3xl",
  wide: "max-w-6xl",
  full: "max-w-none",
};

const BACKGROUND_CLASSES: Record<PageSettings["background"], string> = {
  default: "",
  surface: "bg-surface",
  sunken: "bg-sunken",
  "brand-tint": "bg-brand/5",
};

export function PageRenderer({
  title,
  sections,
  settings,
  locale,
  products = [],
}: PageRendererProps) {
  const lang = resolveLang(locale);
  const isRtl = lang === "ar";
  const safe = normalizeSettings(settings);
  const blocks = normalizeSections(sections);
  const headingFont = isRtl ? "font-arabic-heading" : "font-heading";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={`${BACKGROUND_CLASSES[safe.background]} min-h-[50vh]`}
    >
      <div className={`${WIDTH_CLASSES[safe.width]} mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12`}>
        {safe.show_title && (
          <header>
            <h1
              className={`text-3xl sm:text-5xl uppercase text-ink tracking-wide font-medium ${headingFont}`}
            >
              {pickLocalized(title, lang) || "—"}
            </h1>
            <div className="h-1 w-16 bg-brand mt-3" />
          </header>
        )}

        {blocks.length === 0 ? (
          <p className="text-center py-16 text-muted uppercase font-heading">
            No content sections yet.
          </p>
        ) : (
          blocks.map((section, index) => (
            <SectionBlock
              key={section.id || index}
              section={section}
              lang={lang}
              isRtl={isRtl}
              products={products}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface BlockProps {
  section: PageSection;
  lang: "en" | "ar" | "fr";
  isRtl: boolean;
  products: Product[];
}

function SectionBlock({ section, lang, isRtl, products }: BlockProps) {
  const headingFont = isRtl ? "font-arabic-heading" : "font-heading";
  const alignCls = "align" in section && section.align === "center" ? "text-center" : "text-start";

  switch (section.type) {
    case "hero": {
      const title = pickLocalized(section.title, lang);
      const subtitle = pickLocalized(section.subtitle, lang);
      const buttonLabel = pickLocalized(section.button_label, lang);
      const boxAlign =
        section.align === "center" ? "items-center text-center" : "items-start text-start";
      return (
        <section className="relative overflow-hidden border-2 border-line bg-sunken">
          {section.image_url && (
            <>
              {/* Admin-entered remote URL — plain img, same as Hero Images admin */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={section.image_url}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/65" />
            </>
          )}
          <div className={`relative flex flex-col gap-4 p-8 sm:p-14 ${boxAlign}`}>
            <h2 className={`text-4xl sm:text-6xl uppercase text-ink ${headingFont}`}>{title}</h2>
            {subtitle && (
              <p
                className={`max-w-2xl text-ink-dim text-sm sm:text-base leading-relaxed ${
                  isRtl ? "font-arabic-body" : ""
                }`}
              >
                {subtitle}
              </p>
            )}
            {buttonLabel && section.button_link && (
              <StampButton label={buttonLabel} href={section.button_link} variant="brand" />
            )}
          </div>
        </section>
      );
    }

    case "heading": {
      const text = pickLocalized(section.text, lang);
      const Tag = section.level === 3 ? "h3" : "h2";
      return (
        <div className={alignCls}>
          <Tag className={`text-2xl sm:text-4xl uppercase text-ink ${headingFont} ${alignCls}`}>
            {text}
          </Tag>
          <div
            className={`h-1 w-16 bg-brand mt-3 ${section.align === "center" ? "mx-auto" : ""}`}
          />
        </div>
      );
    }

    case "text": {
      const body = pickLocalized(section.body, lang);
      return (
        <div
          className={`text-ink-dim leading-relaxed whitespace-pre-wrap ${alignCls} ${
            isRtl ? "font-arabic-body text-base sm:text-lg" : "text-sm sm:text-base"
          }`}
        >
          {body || "—"}
        </div>
      );
    }

    case "image": {
      const caption = pickLocalized(section.caption, lang) || pickLocalized(section.alt, lang);
      return (
        <figure className="space-y-3">
          <div className="border-2 border-line bg-sunken overflow-hidden">
            {section.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={section.image_url}
                alt={pickLocalized(section.alt, lang)}
                className="w-full max-h-[560px] object-cover"
              />
            ) : (
              <div className="aspect-video flex items-center justify-center text-muted uppercase font-heading">
                No image set
              </div>
            )}
          </div>
          {caption && (
            <figcaption className="text-xs text-muted uppercase tracking-wider font-body">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "gallery": {
      const alt = pickLocalized(section.alt, lang);
      const cols =
        section.columns === 2
          ? "sm:grid-cols-2"
          : section.columns === 4
            ? "sm:grid-cols-4"
            : "sm:grid-cols-3";
      return (
        <div className={`grid grid-cols-1 gap-3 ${cols}`}>
          {section.images.length === 0 && (
            <p className="col-span-full text-center py-8 text-muted uppercase font-heading">
              No gallery images yet
            </p>
          )}
          {section.images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="border-2 border-line bg-sunken overflow-hidden aspect-square"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt || `Gallery image ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      );
    }

    case "faq": {
      const title = pickLocalized(section.title, lang);
      return (
        <div className="space-y-5">
          {title && <SectionHeading text={title} headingFont={headingFont} />}
          <div className="space-y-3">
            {section.items.length === 0 && (
              <p className="text-muted uppercase font-heading">No FAQ items yet</p>
            )}
            {section.items.map((item) => (
              <details
                key={item.id}
                className="group border border-line bg-surface open:border-brand transition-colors"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 p-4 font-heading uppercase text-ink hover:text-brand transition [&::-webkit-details-marker]:hidden">
                  <span>{pickLocalized(item.question, lang) || "—"}</span>
                  <span className="text-brand text-xl leading-none transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div
                  className={`px-4 pb-4 text-ink-dim text-sm leading-relaxed whitespace-pre-wrap ${
                    isRtl ? "font-arabic-body" : ""
                  }`}
                >
                  {pickLocalized(item.answer, lang)}
                </div>
              </details>
            ))}
          </div>
        </div>
      );
    }

    case "products": {
      const title = pickLocalized(section.title, lang);
      const list = (
        section.category_id
          ? products.filter((p) => p.category_id === section.category_id)
          : products
      )
        .filter((p) => Boolean(p.id))
        .slice(0, section.limit);
      return (
        <div className="space-y-6">
          {title && <SectionHeading text={title} headingFont={headingFont} />}
          {list.length === 0 ? (
            <p className="text-center py-8 text-muted uppercase font-heading">
              No products to show yet
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {list.map((product) => (
                <ProductCard key={product.id} product={product} locale={lang} />
              ))}
            </div>
          )}
        </div>
      );
    }

    case "cta": {
      const title = pickLocalized(section.title, lang);
      const body = pickLocalized(section.body, lang);
      const buttonLabel = pickLocalized(section.button_label, lang);
      return (
        <section className="border-2 border-black bg-brand text-white p-8 sm:p-12 shadow-[6px_6px_0px_black] space-y-4">
          {title && <h2 className={`text-3xl sm:text-4xl uppercase ${headingFont}`}>{title}</h2>}
          {body && (
            <p
              className={`max-w-2xl text-white/90 text-sm sm:text-base leading-relaxed ${
                isRtl ? "font-arabic-body" : ""
              }`}
            >
              {body}
            </p>
          )}
          {buttonLabel && section.button_link && (
            <StampButton label={buttonLabel} href={section.button_link} variant="invert" />
          )}
        </section>
      );
    }

    case "divider":
      return section.style === "stamp" ? (
        <div className="flex items-center gap-4 text-brand font-heading uppercase tracking-[0.3em] text-xs">
          <span className="h-px flex-1 bg-line" />
          <span>✦ EGYROCK ✦</span>
          <span className="h-px flex-1 bg-line" />
        </div>
      ) : (
        <hr className="border-line" />
      );

    default:
      return null;
  }
}

/* ---------------------------- shared bits ---------------------------- */

function SectionHeading({
  text,
  headingFont,
  align = "left",
}: {
  text: string;
  headingFont: string;
  align?: "left" | "center";
}) {
  return (
    <div className="space-y-3">
      <h2
        className={`text-2xl sm:text-3xl uppercase text-ink ${headingFont} ${
          align === "center" ? "text-center" : ""
        }`}
      >
        {text}
      </h2>
      <div className={`h-1 w-16 bg-brand ${align === "center" ? "mx-auto" : ""}`} />
    </div>
  );
}

function StampButton({
  label,
  href,
  variant,
}: {
  label: string;
  href: string;
  variant: "brand" | "invert";
}) {
  const cls =
    variant === "brand"
      ? "inline-block font-heading uppercase tracking-wider text-sm px-6 py-3 border-2 border-brand bg-brand text-white shadow-[4px_4px_0px_black] hover:bg-brand-strong transition"
      : "inline-block font-heading uppercase tracking-wider text-sm px-6 py-3 border-2 border-black bg-white text-ink shadow-[4px_4px_0px_black] hover:bg-ink hover:text-brand transition";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {label}
    </a>
  );
}
