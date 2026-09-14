import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Link } from "@/i18n/routing";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/account`);
  }

  const user = session.user as any;
  const isArabic = locale === "ar";
  const isAdmin = user.role === "admin";

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Profile Card */}
      <div className="bg-[#282521] border-2 border-[#3f3b35] p-6 sm:p-8 relative shadow-[6px_6px_0px_#e0562c]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-bold tracking-widest text-[#e0562c] bg-black/60 px-2.5 py-1 border border-[#e0562c]">
                {isAdmin
                  ? isArabic
                    ? "حساب مدير"
                    : "ADMIN ACCOUNT"
                  : isArabic
                    ? "عضو المسرح"
                    : "MEMBER PROFILE"}
              </span>
              <span className="text-xs uppercase px-2 py-0.5 border border-[#3f3b35] text-[#9e978e]">
                Role: {user.role}
              </span>
            </div>

            <h1
              className={`text-3xl sm:text-5xl font-extrabold uppercase text-[#f2ede4] ${
                isArabic ? "font-arabic-heading" : "font-heading"
              }`}
            >
              {user.name || "Rock Enthusiast"}
            </h1>

            <p className="text-sm text-[#9e978e] font-mono">{user.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="px-5 py-2.5 bg-[#e0562c] hover:bg-[#c44721] text-white font-heading uppercase text-sm tracking-wider border-2 border-black shadow-[3px_3px_0px_black] transition"
              >
                {isArabic ? "لوحة الإدارة" : "ADMIN DASHBOARD"}
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Order History Section */}
      <section className="space-y-6">
        <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#e0562c] pl-4 rtl:pl-0 rtl:pr-4">
          <h2
            className={`text-2xl sm:text-3xl font-extrabold uppercase text-[#f2ede4] ${
              isArabic ? "font-arabic-heading" : "font-heading"
            }`}
          >
            {isArabic ? "سجل الطلبات والإيصالات" : "ORDER & RECEIPT HISTORY"}
          </h2>
          <p className="text-sm text-[#9e978e]">
            {isArabic
              ? "متابعة حالة مدفوعاتك وتأكيدات إنستاباي اليدوية"
              : "Track manual InstaPay verification and shipment status"}
          </p>
        </div>

        {/* Empty / Placeholder Order History */}
        <div className="bg-[#282521] border-2 border-[#3f3b35] p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-[#1c1a17] border border-[#3f3b35] flex items-center justify-center text-[#e0562c]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-heading text-lg uppercase text-[#f2ede4]">
              {isArabic ? "لا توجد طلبات سابقة حتى الآن" : "NO ORDERS RECORDED YET"}
            </h3>
            <p className="text-xs text-[#9e978e] mt-1 max-w-md mx-auto">
              {isArabic
                ? "عندما تطلب أي كورس ملموس أو تيشيرت وترفع إيصال إنستاباي، ستظهر بيانات الطلب وحالته هنا مباشرة."
                : "When you place an order and upload your InstaPay screenshot, its live verification status will appear here."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/catalog"
              className="inline-block px-5 py-2.5 border-2 border-[#e0562c] text-[#e0562c] hover:bg-[#e0562c] hover:text-white font-heading uppercase text-xs tracking-wider transition"
            >
              {isArabic ? "تصفح المنتجات الآن" : "EXPLORE MERCH NOW"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
