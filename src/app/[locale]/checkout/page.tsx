"use client";

import React, { useMemo, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const { data: session } = useSession();
  const user = session?.user as any;
  const registeredAddress = user?.address || "";

  /**
   * Customer fields are DERIVED, not synced through an effect:
   * once the session resolves (it does so after mount) the form pre-fills from
   * the registered profile, and anything the shopper actually types is stored
   * in `formEdits` and wins from then on.
   */
  const [formEdits, setFormEdits] = useState<{
    customer_name?: string;
    customer_phone?: string;
    shipping_address?: string;
    city?: string;
  }>({});

  const formData = {
    customer_name: formEdits.customer_name ?? user?.name ?? "",
    customer_phone: formEdits.customer_phone ?? user?.phone ?? "",
    shipping_address: formEdits.shipping_address ?? "",
    city: formEdits.city ?? "",
  };

  // Registered users can ship to their saved address or pick another one.
  const [addressChoiceOverride, setAddressChoiceOverride] = useState<"registered" | "other" | null>(
    null,
  );
  const addressChoice: "registered" | "other" =
    addressChoiceOverride ?? (registeredAddress ? "registered" : "other");
  const setAddressChoice = setAddressChoiceOverride;

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [receiptBase64, setReceiptBase64] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finalTotal = useMemo(() => Math.max(0, totalPrice - discount), [totalPrice, discount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormEdits((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;

    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: totalPrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid coupon");

      setCouponCode(data.code);
      setDiscount(data.discount);
      setCouponInput(data.code);
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon");
      setCouponCode("");
      setDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponInput("");
    setCouponCode("");
    setDiscount(0);
    setCouponError("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // We will compress the image to a base64 string
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compress to JPEG with 0.6 quality to keep Base64 string small for Google Sheets
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        setReceiptBase64(dataUrl);
      };
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptBase64) {
      setError(isArabic ? "يرجى إرفاق صورة إيصال التحويل" : "Please attach the transfer receipt");
      return;
    }

    // Ship to the registered address or the manually entered one.
    const shipping_address =
      addressChoice === "registered" && registeredAddress
        ? registeredAddress
        : `${formData.shipping_address}, ${formData.city}`;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          shipping_address,
          items,
          receipt_image_url: receiptBase64,
          coupon_code: couponCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      clearCart();
      router.push(`/${locale}/checkout/success?orderId=${data.orderId}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit order");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-heading text-ink uppercase mb-4">
          {isArabic ? "السلة فارغة" : "Cart is empty"}
        </h1>
        <p className="text-muted">
          {isArabic ? "لم تقم بإضافة منتجات بعد." : "You haven't added any items yet."}
        </p>
      </div>
    );
  }

  const usingRegistered = addressChoice === "registered" && Boolean(registeredAddress);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1
        className={`text-3xl sm:text-4xl font-extrabold uppercase text-ink tracking-tight mb-8 ${isArabic ? "font-arabic-heading" : "font-heading"}`}
      >
        {isArabic ? "إتمام الطلب" : "Checkout"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-8">
          {/* Shipping Form */}
          <div className="bg-surface border-2 border-line p-6 shadow-[6px_6px_0px_var(--color-brand)]">
            <h2 className="text-xl font-heading uppercase text-ink mb-4 border-b border-line pb-2">
              {isArabic ? "بيانات الشحن" : "Shipping Details"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5">
                    {isArabic ? "الاسم الكامل" : "Full Name"}
                  </label>
                  <input
                    required
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-2 text-sm outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5">
                    {isArabic ? "رقم الهاتف" : "Phone Number"}
                  </label>
                  <input
                    required
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-2 text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Ship to registered address vs. another address */}
              {registeredAddress && (
                <div className="mt-4 space-y-2">
                  <span className="block text-xs uppercase tracking-wider font-bold text-ink">
                    {isArabic ? "عنوان الشحن" : "Shipping Address"}
                  </span>

                  <label
                    className={`flex items-start gap-3 p-3 border-2 cursor-pointer transition ${
                      addressChoice === "registered" ? "border-brand bg-brand/5" : "border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address_choice"
                      checked={addressChoice === "registered"}
                      onChange={() => setAddressChoice("registered")}
                      className="mt-1 accent-brand"
                    />
                    <span className="text-sm">
                      <span className="block font-bold uppercase text-ink text-xs mb-0.5">
                        {isArabic ? "شحن إلى عنواني المسجل" : "Ship to my registered address"}
                      </span>
                      <span className="text-muted text-xs">{registeredAddress}</span>
                    </span>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 border-2 cursor-pointer transition ${
                      addressChoice === "other" ? "border-brand bg-brand/5" : "border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address_choice"
                      checked={addressChoice === "other"}
                      onChange={() => setAddressChoice("other")}
                      className="mt-1 accent-brand"
                    />
                    <span className="text-sm font-bold uppercase text-ink text-xs">
                      {isArabic ? "شحن إلى عنوان آخر" : "Ship to a different address"}
                    </span>
                  </label>
                </div>
              )}

              {/* Manual address fields — only when no registered address is used */}
              {!usingRegistered && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5">
                      {isArabic ? "العنوان التفصيلي" : "Detailed Address"}
                    </label>
                    <textarea
                      required
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-2 text-sm outline-none transition resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5">
                      {isArabic ? "المدينة / المحافظة" : "City / Governorate"}
                    </label>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-canvas border-2 border-line focus:border-brand text-ink px-4 py-2 text-sm outline-none transition"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* InstaPay Form */}
          <div className="bg-canvas border-2 border-brand p-6 shadow-[6px_6px_0px_var(--color-brand)]">
            <h2 className="text-xl font-heading uppercase text-brand mb-4 border-b border-line pb-2">
              {isArabic ? "الدفع عبر إنستاباي" : "Pay via InstaPay"}
            </h2>
            <div className="text-sm text-ink mb-6 space-y-2">
              <p>
                {isArabic
                  ? "يرجى تحويل إجمالي المبلغ إلى عنوان إنستاباي التالي:"
                  : "Please transfer the exact total amount to the following InstaPay address:"}
              </p>
              <div className="bg-black p-4 text-center border border-line">
                <p className="font-heading text-2xl tracking-widest text-success">
                  egyrock@instapay
                </p>
                <p className="mt-2 text-xs text-muted">
                  {isArabic ? "رقم الهاتف المربوط: 01000000000" : "Linked Mobile: 01000000000"}
                </p>
              </div>
              <p className="font-bold pt-2 text-brand">
                {isArabic
                  ? `المبلغ المطلوب: ${finalTotal} ج.م`
                  : `Amount to send: EGP ${finalTotal}`}
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5">
                {isArabic ? "إرفاق صورة إيصال التحويل" : "Upload Transfer Receipt"}
              </label>
              <input
                required
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
                className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:uppercase file:font-bold file:bg-line file:text-ink hover:file:bg-surface transition"
              />
              {receiptBase64 && (
                <div className="mt-4">
                  <p className="text-xs text-success font-bold uppercase mb-2">
                    {isArabic ? "تم إرفاق الإيصال بنجاح" : "Receipt uploaded successfully"}
                  </p>
                  <div className="relative w-32 h-48 border border-line">
                    <Image src={receiptBase64} alt="Receipt" fill className="object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-surface border-2 border-line p-6 sticky top-24">
            <h2 className="text-xl font-heading uppercase text-ink mb-4 border-b border-line pb-2">
              {isArabic ? "ملخص الطلب" : "Order Summary"}
            </h2>
            <div className="space-y-4 mb-4 max-h-64 overflow-y-auto pr-2">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size || "one-size"}`}
                  className="flex justify-between items-start text-sm"
                >
                  <div className="flex-1 pr-4">
                    <p className="text-ink font-bold">
                      {isArabic ? item.product.name_ar : item.product.name_en}
                    </p>
                    <p className="text-muted text-xs">
                      {isArabic ? "الكمية" : "Qty"}: {item.quantity}
                      {item.size && (
                        <span className="ms-2 uppercase">
                          — {isArabic ? "المقاس" : "Size"}: {item.size}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-brand font-bold whitespace-nowrap">
                    EGP {item.product.price * item.quantity}
                  </p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-line pt-4 mb-4">
              {!couponCode ? (
                <>
                  <label className="block text-xs uppercase tracking-wider font-bold text-ink mb-1.5">
                    {isArabic ? "كود الخصم" : "Coupon Code"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder={isArabic ? "مثال: ROCK10" : "e.g. ROCK10"}
                      className="flex-1 min-w-0 bg-canvas border-2 border-line focus:border-brand text-ink px-3 py-2 text-sm uppercase outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="px-4 py-2 border-2 border-line text-ink font-heading uppercase text-xs tracking-wider hover:border-brand hover:text-brand transition disabled:opacity-50 cursor-pointer"
                    >
                      {couponLoading ? "..." : isArabic ? "تطبيق" : "APPLY"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="mt-2 text-xs text-danger font-bold uppercase">{couponError}</p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-3 border-2 border-success bg-success/10">
                  <div>
                    <p className="text-xs text-success font-bold uppercase">
                      {isArabic ? "تم تطبيق الخصم" : "Coupon applied"}: {couponCode}
                    </p>
                    <p className="text-xs text-muted">− EGP {discount}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs text-muted hover:text-danger uppercase font-bold transition cursor-pointer"
                  >
                    {isArabic ? "إزالة" : "REMOVE"}
                  </button>
                </div>
              )}
            </div>

            {/* Subtotal / discount / total */}
            <div className="border-t border-line pt-4 mb-6 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted uppercase">
                  {isArabic ? "المجموع الفرعي" : "Subtotal"}
                </span>
                <span className="text-ink">EGP {totalPrice}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-success uppercase">{isArabic ? "الخصم" : "Discount"}</span>
                  <span className="text-success">− EGP {discount}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t border-line pt-2">
                <span className="text-ink uppercase">{isArabic ? "الإجمالي" : "Total"}</span>
                <span className="text-brand">EGP {finalTotal}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-danger/15 border-2 border-danger text-danger text-xs uppercase font-bold tracking-wider">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 px-4 bg-brand hover:bg-brand-strong text-white font-heading uppercase text-lg tracking-wider transition border-2 border-black shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_black] cursor-pointer disabled:opacity-60"
            >
              {loading
                ? isArabic
                  ? "جاري تأكيد الطلب..."
                  : "CONFIRMING ORDER..."
                : isArabic
                  ? "تأكيد الطلب والدفع"
                  : "CONFIRM & PAY"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
