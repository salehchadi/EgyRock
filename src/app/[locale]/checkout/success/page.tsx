"use client";

import React, { Suspense } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const isArabic = locale === "ar";

  return (
    <div className="max-w-xl w-full bg-[#282521] border-2 border-[#3f3b35] p-8 shadow-[6px_6px_0px_#2ea043]">
      <div className="mx-auto w-16 h-16 bg-[#2ea043] rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1
        className={`text-3xl sm:text-4xl font-extrabold uppercase text-[#f2ede4] tracking-tight mb-4 ${isArabic ? "font-arabic-heading" : "font-heading"}`}
      >
        {isArabic ? "تم استلام الطلب" : "Order Received"}
      </h1>

      <p className="text-[#9e978e] mb-6">
        {isArabic
          ? "شكرًا لك! لقد تم استلام طلبك وجاري مراجعة إيصال التحويل الخاص بك. سنقوم بتأكيد الطلب قريباً."
          : "Thank you! Your order has been received and your transfer receipt is under review. We will confirm your order shortly."}
      </p>

      {orderId && (
        <div className="bg-[#1c1a17] border border-[#3f3b35] p-4 mb-8">
          <p className="text-xs uppercase font-bold text-[#9e978e] tracking-wider mb-1">
            {isArabic ? "رقم الطلب" : "Order ID"}
          </p>
          <p className="font-heading text-2xl text-[#e0562c] tracking-widest">{orderId}</p>
        </div>
      )}

      <div className="space-y-4">
        <Link
          href="/account"
          className="block w-full py-3.5 px-4 bg-[#e0562c] hover:bg-[#c44721] text-white font-heading uppercase text-base tracking-wider transition border-2 border-black shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_black] text-center"
        >
          {isArabic ? "عرض طلباتي" : "View My Orders"}
        </Link>

        <Link
          href="/"
          className="block w-full py-3.5 px-4 bg-transparent border-2 border-[#3f3b35] hover:border-[#f2ede4] text-[#f2ede4] font-heading uppercase text-base tracking-wider transition text-center"
        >
          {isArabic ? "العودة للرئيسية" : "Return to Home"}
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 text-center bg-screen-print">
      <Suspense
        fallback={
          <div className="max-w-xl w-full bg-[#282521] border-2 border-[#3f3b35] p-8 text-center text-[#9e978e] font-heading uppercase">
            Loading...
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
