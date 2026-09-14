"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";

function LoginForm() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}/account`;

  const isArabic = locale === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError(
          isArabic
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
            : locale === "fr"
              ? "Identifiants invalides"
              : "Invalid email or password",
        );
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full space-y-8 bg-[#282521] border-2 border-[#3f3b35] p-8 shadow-[6px_6px_0px_#e0562c]">
      <div>
        <div className="inline-block mb-3">
          <span className="text-xs uppercase font-bold tracking-widest text-[#e0562c] bg-black/50 px-2.5 py-1 border border-[#e0562c]">
            {isArabic ? "بوابة الدخول" : "ACCESS GATE"}
          </span>
        </div>
        <h1
          className={`text-3xl sm:text-4xl font-extrabold uppercase text-[#f2ede4] tracking-tight ${
            isArabic ? "font-arabic-heading" : "font-heading"
          }`}
        >
          {isArabic ? "تسجيل الدخول" : locale === "fr" ? "Connexion" : "SIGN IN"}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#9e978e]">
          {isArabic
            ? "سجل دخولك لمتابعة طلباتك وإيصالات إنستاباي"
            : "Log into your customer or admin account"}
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
              {isArabic ? "كلمة المرور" : "Password"}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
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
                ? "جاري التحقق..."
                : "AUTHENTICATING..."
              : isArabic
                ? "دخول الحساب"
                : "SIGN IN"}
          </button>
        </div>
      </form>

      <div className="pt-4 border-t border-[#3f3b35] flex items-center justify-between text-xs text-[#9e978e]">
        <span>{isArabic ? "ليس لديك حساب؟" : "Don't have an account?"}</span>
        <Link
          href="/auth/register"
          className="text-[#e0562c] hover:underline font-bold uppercase tracking-wider"
        >
          {isArabic ? "إنشاء حساب جديد" : "REGISTER NOW"}
        </Link>
      </div>

      <div className="p-3 bg-[#1c1a17] border border-[#3f3b35] text-[11px] text-[#9e978e] space-y-1">
        <p className="font-bold text-[#f2ede4] uppercase">Demo Credentials:</p>
        <p>
          Admin: <code className="text-[#e0562c]">admin@egyrock.com</code> /{" "}
          <code className="text-[#f2ede4]">admin123</code>
        </p>
        <p>
          Customer: <code className="text-[#e0562c]">customer@egyrock.local</code> /{" "}
          <code className="text-[#f2ede4]">customer123</code>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-screen-print">
      <Suspense
        fallback={
          <div className="max-w-md w-full p-8 text-center bg-[#282521] border border-[#3f3b35] text-[#9e978e] font-heading uppercase">
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
