import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/admin`);
  }

  const user = session.user as any;

  // Strictest enforcement: non-admin roles are immediately blocked and redirected
  if (user.role !== "admin") {
    redirect(`/${locale}/account?error=forbidden_admin_only`);
  }

  const isArabic = locale === "ar";

  const adminSections = [
    {
      title: "Products & Inventory",
      desc: "Manage catalog, stock quantities, and physical course packages",
      path: "/admin/products",
      count: "8 Products",
    },
    {
      title: "Categories",
      desc: "Rename or create dynamic product categories",
      path: "/admin/categories",
      count: "4 Active",
    },
    {
      title: "Orders & Receipts",
      desc: "Inspect InstaPay transaction screenshots and confirm/reject orders",
      path: "/admin/orders",
      count: "0 Pending",
    },
    {
      title: "Homepage Hero",
      desc: "Configure rotating banner images, headlines, and destination links",
      path: "/admin/hero",
      count: "3 Slides",
    },
    {
      title: "Dynamic Pages",
      desc: "Create, edit, and delete custom pages (About, Shipping, FAQ)",
      path: "/admin/pages",
      count: "2 Published",
    },
    {
      title: "Translations",
      desc: "Manage UI string translations across EN, AR, and FR without code",
      path: "/admin/translations",
      count: "35 Keys",
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
            <p className="text-xs sm:text-sm text-[#9e978e] mt-1">
              Logged in as Administrator:{" "}
              <span className="text-[#f2ede4] font-mono">{user.email}</span>
            </p>
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
          <div
            key={sec.title}
            className="underground-card p-6 flex flex-col justify-between border-2 border-[#3f3b35] hover:border-[#e0562c] transition"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#e0562c] uppercase font-bold">
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
                Phase 10 Module
              </span>
              <span className="text-xs text-[#9e978e]">Protected &rarr;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
