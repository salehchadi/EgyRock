import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PosterBadge } from "@/components/ui/PosterBadge";

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  setRequestLocale(locale);

  const t = useTranslations();
  const isArabic = locale === "ar";

  const categories = [
    {
      id: "courses",
      title: t("categories.courses"),
      desc: t("categories.coursesDesc"),
      image: "/images/placeholders/egyrock-1.jpeg",
      badgeStatus: "countdown" as const,
      badgeQty: 3,
    },
    {
      id: "tshirts",
      title: t("categories.tshirts"),
      desc: t("categories.tshirtsDesc"),
      image: "/images/placeholders/egyrock-2.jpeg",
      badgeStatus: "in_stock" as const,
    },
    {
      id: "mugs",
      title: t("categories.mugs"),
      desc: t("categories.mugsDesc"),
      image: "/images/placeholders/egyrock-3.jpeg",
      badgeStatus: "in_stock" as const,
    },
    {
      id: "accessories",
      title: t("categories.accessories"),
      desc: t("categories.accessoriesDesc"),
      image: "/images/placeholders/egyrock-5.jpeg",
      badgeStatus: "out_of_stock" as const,
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative bg-screen-print border-b-2 border-[#3f3b35] py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-[inset_0_-20px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-block">
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-[#e0562c] bg-[#282521] border border-[#e0562c] px-3 py-1 shadow-[2px_2px_0px_#e0562c]">
                {t("hero.badge")}
              </span>
            </div>

            <h1
              className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase text-[#f2ede4] leading-[0.95] tracking-tight ${
                isArabic ? "font-arabic-heading" : "font-heading"
              }`}
            >
              {t("hero.title")}
            </h1>

            <p
              className={`text-base sm:text-lg text-[#c5beaf] max-w-2xl leading-relaxed ${
                isArabic ? "font-arabic-body" : "font-body"
              }`}
            >
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/catalog"
                className="px-6 py-3.5 bg-[#e0562c] hover:bg-[#c44721] text-white font-heading uppercase text-sm sm:text-base tracking-wider transition border-2 border-black shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_black]"
              >
                {t("hero.ctaShop")}
              </Link>
              <Link
                href="/catalog?category=courses"
                className="px-6 py-3.5 bg-[#282521] hover:bg-[#332f2a] text-[#f2ede4] font-heading uppercase text-sm sm:text-base tracking-wider transition border-2 border-[#3f3b35] hover:border-[#f2ede4] shadow-[4px_4px_0px_rgba(0,0,0,0.5)]"
              >
                {t("hero.ctaCourses")}
              </Link>
            </div>
          </div>

          {/* Hero Featured Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] sm:aspect-square w-full max-w-md mx-auto border-2 border-[#e0562c] bg-[#282521] p-3 shadow-[8px_8px_0px_#e0562c]">
              <div className="relative w-full h-full overflow-hidden bg-black">
                <Image
                  src="/images/placeholders/egyrock-12.jpeg"
                  alt="Cairo Underground Rock Banner"
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute bottom-3 left-3 rtl:left-auto rtl:right-3">
                  <PosterBadge status="countdown" quantity={4} locale={locale} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop By Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#e0562c] pl-4 rtl:pl-0 rtl:pr-4 mb-8">
          <h2
            className={`text-2xl sm:text-4xl font-extrabold uppercase text-[#f2ede4] ${
              isArabic ? "font-arabic-heading" : "font-heading"
            }`}
          >
            {t("categories.title")}
          </h2>
          <p className="text-sm sm:text-base text-[#9e978e] mt-1">{t("categories.subtitle")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="underground-card p-4 flex flex-col justify-between group">
              <div className="relative aspect-square w-full overflow-hidden bg-[#141210] border border-[#3f3b35] mb-4">
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 z-10">
                  <PosterBadge
                    status={cat.badgeStatus}
                    quantity={cat.badgeQty}
                    locale={locale}
                    size="sm"
                  />
                </div>
              </div>

              <div className="space-y-2 flex-grow flex flex-col justify-between">
                <div>
                  <h3
                    className={`text-xl uppercase text-[#f2ede4] group-hover:text-[#e0562c] transition ${
                      isArabic ? "font-arabic-heading font-bold" : "font-heading"
                    }`}
                  >
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[#9e978e] mt-1 line-clamp-2">{cat.desc}</p>
                </div>

                <div className="pt-3 border-t border-[#3f3b35] mt-3">
                  <Link
                    href={`/catalog?category=${cat.id}`}
                    className="inline-flex items-center gap-1 text-xs font-heading uppercase tracking-wider text-[#e0562c] hover:underline"
                  >
                    {t("actions.viewDetails")} &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
