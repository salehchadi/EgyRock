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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
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
        body: JSON.stringify({ name, email, password, phone, address, gender, age }),
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
      <div className="max-w-md w-full space-y-8 bg-surface border-2 border-line p-8 shadow-[6px_6px_0px_var(--color-brand)]">
        <div>
          <div className="inline-block mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-brand bg-black/50 px-2.5 py-1 border border-brand">
              {isArabic ? "انضم إلى المشهد" : "JOIN THE SCENE"}
            </span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-extrabold uppercase text-ink tracking-tight ${
              isArabic ? "font-arabic-heading" : "font-heading"
            }`}
          >
            {isArabic ? "إنشاء حساب جديد" : locale === "fr" ? "Inscription" : "REGISTER"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted">
            {isArabic
              ? "أنشئ حسابك لطلب الدورات الملموسة والتيشيرتات ومتابعة الإيصالات"
              : "Create an account to order physical kits and track your orders"}
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
                htmlFor="name"
                className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5"
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
                className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-3 text-sm outline-none transition"
              />
            </div>

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
                className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-3 text-sm outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5"
              >
                {isArabic ? "رقم الهاتف" : "Phone Number"}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-3 text-sm outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5"
              >
                {isArabic ? "عنوان السكن" : "Location Address"}
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={
                  isArabic
                    ? "الشارع، المنطقة، المدينة، المحافظة"
                    : "Street, area, city, governorate"
                }
                className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-3 text-sm outline-none transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="gender"
                  className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5"
                >
                  {isArabic ? "الجنس" : "Gender"}
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-3 text-sm outline-none transition"
                >
                  <option value="" disabled>
                    {isArabic ? "اختر..." : "Select..."}
                  </option>
                  <option value="male">{isArabic ? "ذكر" : "Male"}</option>
                  <option value="female">{isArabic ? "أنثى" : "Female"}</option>
                  <option value="other">{isArabic ? "أخر" : "Other"}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="age"
                  className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5"
                >
                  {isArabic ? "العمر" : "Age"}
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  required
                  min={13}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="18"
                  className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-3 text-sm outline-none transition"
                />
              </div>
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
                  ? "جاري إنشاء الحساب..."
                  : "CREATING ACCOUNT..."
                : isArabic
                  ? "إنشاء الحساب"
                  : "CREATE ACCOUNT"}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-line flex items-center justify-between text-xs text-muted">
          <span>{isArabic ? "لديك حساب بالفعل؟" : "Already have an account?"}</span>
          <Link
            href="/auth/login"
            className="text-brand hover:underline font-bold uppercase tracking-wider"
          >
            {isArabic ? "تسجيل الدخول" : "SIGN IN"}
          </Link>
        </div>
      </div>
    </div>
  );
}
