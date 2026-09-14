"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";

export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Auto-sign in after registration
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.error) {
        router.push(`/${locale}/auth/login`);
      } else {
        router.push(`/${locale}/account`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-screen-print">
      <div className="max-w-md w-full space-y-8 bg-[#282521] border-2 border-[#3f3b35] p-8 shadow-[6px_6px_0px_#e0562c]">
        <div>
          <div className="inline-block mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-[#e0562c] bg-black/50 px-2.5 py-1 border border-[#e0562c]">
              {isArabic ? "انضم إلى المشهد" : "JOIN THE SCENE"}
            </span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-extrabold uppercase text-[#f2ede4] tracking-tight ${
              isArabic ? "font-arabic-heading" : "font-heading"
            }`}
          >
            {isArabic ? "إنشاء حساب جديد" : locale === "fr" ? "Inscription" : "REGISTER"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#9e978e]">
            {isArabic
              ? "أنشئ حسابك لطلب الدورات الملموسة والتيشيرتات ومتابعة الإيصالات"
              : "Create an account to order physical kits and track your orders"}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#dc2626]/15 border-2 border-[#dc2626] text-[#dc2626] text-xs uppercase font-bold tracking-wider">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs uppercase tracking-wider font-bold text-[#f2ede4] mb-1.5"
              >
                {isArabic ? "الاسم بالكامل" : "Full Name"}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sherif El-Rock"
                className="w-full bg-[#1c1a17] border-2 border-[#3f3b35] focus:border-[#e0562c] text-[#f2ede4] px-4 py-3 text-sm outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wider font-bold text-[#f2ede4] mb-1.5"
              >
                {isArabic ? "البريد الإلكتروني" : "Email Address"}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-[#1c1a17] border-2 border-[#3f3b35] focus:border-[#e0562c] text-[#f2ede4] px-4 py-3 text-sm outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-wider font-bold text-[#f2ede4] mb-1.5"
              >
                {isArabic ? "كلمة المرور (٦ أحرف على الأقل)" : "Password (min 6 characters)"}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1c1a17] border-2 border-[#3f3b35] focus:border-[#e0562c] text-[#f2ede4] px-4 py-3 text-sm outline-none transition"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#e0562c] hover:bg-[#c44721] text-white font-heading uppercase text-base tracking-wider transition border-2 border-black shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_black] cursor-pointer disabled:opacity-60"
            >
              {loading
                ? isArabic
                  ? "جاري إنشاء الحساب..."
                  : "CREATING ACCOUNT..."
                : isArabic
                  ? "إنشاء الحساب"
                  : "CREATE ACCOUNT"}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-[#3f3b35] flex items-center justify-between text-xs text-[#9e978e]">
          <span>{isArabic ? "لديك حساب بالفعل؟" : "Already have an account?"}</span>
          <Link
            href="/auth/login"
            className="text-[#e0562c] hover:underline font-bold uppercase tracking-wider"
          >
            {isArabic ? "تسجيل الدخول" : "SIGN IN"}
          </Link>
        </div>
      </div>
    </div>
  );
}
