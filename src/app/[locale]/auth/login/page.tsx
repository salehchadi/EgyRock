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
    <div className="max-w-md w-full space-y-8 bg-surface border-2 border-line p-8 shadow-[6px_6px_0px_var(--color-brand)]">
      <div>
        <div className="inline-block mb-3">
          <span className="text-xs uppercase font-bold tracking-widest text-brand bg-black/50 px-2.5 py-1 border border-brand">
            {isArabic ? "بوابة الدخول" : "ACCESS GATE"}
          </span>
        </div>
        <h1
          className={`text-3xl sm:text-4xl font-extrabold uppercase text-ink tracking-tight ${
            isArabic ? "font-arabic-heading" : "font-heading"
          }`}
        >
          {isArabic ? "تسجيل الدخول" : locale === "fr" ? "Connexion" : "SIGN IN"}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted">
          {isArabic
            ? "سجل دخولك لمتابعة طلباتك وإيصالات إنستاباي"
            : "Log into your customer or admin account"}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-danger/15 border-2 border-danger text-danger text-xs uppercase font-bold tracking-wider">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5"
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
              className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-3 text-sm outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5"
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
              className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-3 text-sm outline-none transition"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-brand hover:bg-brand-strong text-white font-heading uppercase text-base tracking-wider transition border-2 border-black shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_black] cursor-pointer disabled:opacity-60"
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

      <div className="pt-4 border-t border-line flex items-center justify-between text-xs text-muted">
        <span>{isArabic ? "ليس لديك حساب؟" : "Don't have an account?"}</span>
        <Link
          href="/auth/register"
          className="text-brand hover:underline font-bold uppercase tracking-wider"
        >
          {isArabic ? "إنشاء حساب جديد" : "REGISTER NOW"}
        </Link>
      </div>

      <div className="p-3 bg-canvas border border-line text-[11px] text-muted space-y-1">
        <p className="font-bold text-ink uppercase">Demo Credentials:</p>
        <p>
          Admin: <code className="text-brand">admin@egyrock.com</code> /{" "}
          <code className="text-ink">admin123</code>
        </p>
        <p>
          Customer: <code className="text-brand">customer@egyrock.local</code> /{" "}
          <code className="text-ink">customer123</code>
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
          <div className="max-w-md w-full p-8 text-center bg-surface border border-line text-muted font-heading uppercase">
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
