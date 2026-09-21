import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin", icon: "◆" },
  { label: "Products", path: "/admin/products", icon: "▣" },
  { label: "Categories", path: "/admin/categories", icon: "▤" },
  { label: "Orders", path: "/admin/orders", icon: "▥" },
  { label: "Hero Images", path: "/admin/hero", icon: "▧" },
  { label: "Pages", path: "/admin/pages", icon: "▨" },
  { label: "Translations", path: "/admin/translations", icon: "▩" },
];

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "admin") {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/admin`);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-56 bg-[#141210] border-b lg:border-b-0 lg:border-r border-[#3f3b35] lg:min-h-screen flex-shrink-0">
        <div className="p-4 border-b border-[#3f3b35]">
          <Link href="/" className="block">
            <span className="text-xl font-heading text-[#e0562c] tracking-wider">EGYROCK</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[#9e978e] mt-0.5">
              Admin Panel
            </span>
          </Link>
        </div>

        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible p-2 gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs uppercase tracking-wider text-[#9e978e] hover:text-[#f2ede4] hover:bg-[#282521] transition whitespace-nowrap font-heading"
            >
              <span className="text-[#e0562c] text-sm">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block mt-auto p-4 border-t border-[#3f3b35]">
          <Link
            href="/"
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#9e978e] hover:text-[#e0562c] transition"
          >
            ← View Storefront
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
