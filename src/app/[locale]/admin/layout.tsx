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
  { label: "Coupons", path: "/admin/coupons", icon: "★" },
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
      <aside className="w-full lg:w-56 bg-sunken border-b lg:border-b-0 lg:border-r border-line lg:min-h-screen flex-shrink-0">
        <div className="p-4 border-b border-line">
          <Link href="/" className="block">
            <span className="text-xl font-heading text-brand tracking-wider">EGYROCK</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-muted mt-0.5">
              Admin Panel
            </span>
          </Link>
        </div>

        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible p-2 gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs uppercase tracking-wider text-muted hover:text-ink hover:bg-surface transition whitespace-nowrap font-heading"
            >
              <span className="text-brand text-sm">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block mt-auto p-4 border-t border-line">
          <Link
            href="/"
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted hover:text-brand transition"
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
