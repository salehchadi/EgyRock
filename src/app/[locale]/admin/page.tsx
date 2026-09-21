import React from "react";
import { Link } from "@/i18n/routing";
import { getProducts } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import { getOrders } from "@/lib/data/orders";
import { getHomepageImages } from "@/lib/data/homepageImages";
import { getPages } from "@/lib/data/pages";
import { getTranslations } from "@/lib/data/translations";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  // Fetch real counts from DAL
  const [products, categories, orders, heroImages, pages, translations] = await Promise.all([
    getProducts(),
    getCategories(),
    getOrders(),
    getHomepageImages(),
    getPages(),
    getTranslations(),
  ]);

  const pendingOrders = orders.filter((o) => o.status === "Pending payment");

  const adminSections = [
    {
      title: "Products & Inventory",
      desc: "Manage catalog, stock quantities, and physical course packages",
      path: "/admin/products" as const,
      count: `${products.length} Products`,
    },
    {
      title: "Categories",
      desc: "Rename or create dynamic product categories",
      path: "/admin/categories" as const,
      count: `${categories.length} Active`,
    },
    {
      title: "Orders & Receipts",
      desc: "Inspect InstaPay transaction screenshots and confirm/reject orders",
      path: "/admin/orders" as const,
      count: `${pendingOrders.length} Pending`,
      highlight: pendingOrders.length > 0,
    },
    {
      title: "Homepage Hero",
      desc: "Configure rotating banner images, headlines, and destination links",
      path: "/admin/hero" as const,
      count: `${heroImages.length} Slides`,
    },
    {
      title: "Dynamic Pages",
      desc: "Create, edit, and delete custom pages (About, Shipping, FAQ)",
      path: "/admin/pages" as const,
      count: `${pages.filter((p) => p.is_published).length} Published`,
    },
    {
      title: "Translations",
      desc: "Manage UI string translations across EN, AR, and FR without code",
      path: "/admin/translations" as const,
      count: `${translations.length} Keys`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Admin Banner */}
      <div className="bg-[#282521] border-2 border-[#e0562c] p-6 sm:p-8 relative shadow-[6px_6px_0px_#e0562c]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-block mb-2">
              <span className="text-xs uppercase font-bold tracking-widest text-black bg-[#e0562c] px-2.5 py-0.5 font-heading">
                CONFIDENTIAL / RESTRICTED ACCESS
              </span>
            </div>
            <h1
              className={`text-3xl sm:text-5xl font-extrabold uppercase text-[#f2ede4] ${
                isArabic ? "font-arabic-heading" : "font-heading"
              }`}
            >
              {isArabic ? "مركز تحكم إيجي روك" : "EGYROCK CONTROL CENTER"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 border border-[#3f3b35] hover:border-[#f2ede4] text-xs font-heading uppercase tracking-wider text-[#f2ede4] transition"
            >
              View Storefront
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Module Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((sec) => (
          <Link key={sec.title} href={sec.path}>
            <div
              className={`underground-card p-6 flex flex-col justify-between border-2 transition h-full ${
                (sec as any).highlight
                  ? "border-[#d97706]"
                  : "border-[#3f3b35] hover:border-[#e0562c]"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-mono uppercase font-bold ${
                      (sec as any).highlight ? "text-[#d97706]" : "text-[#e0562c]"
                    }`}
                  >
                    {sec.count}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#9e978e] bg-black/40 px-2 py-0.5">
                    Live DAL
                  </span>
                </div>
                <h2 className="font-heading text-2xl uppercase text-[#f2ede4] tracking-wide">
                  {sec.title}
                </h2>
                <p className="text-xs text-[#9e978e] leading-relaxed">{sec.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#3f3b35] flex items-center justify-between">
                <span className="text-xs uppercase font-heading text-[#e0562c] tracking-wider">
                  Manage →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
