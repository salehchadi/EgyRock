"use client";

import React, { useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    shipping_address: "",
    city: "",
  });

  const [receiptBase64, setReceiptBase64] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          shipping_address: `${formData.shipping_address}, ${formData.city}`,
          items,
          receipt_image_url: receiptBase64,
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
        <h1 className="text-3xl font-heading text-[#f2ede4] uppercase mb-4">
          {isArabic ? "السلة فارغة" : "Cart is empty"}
        </h1>
        <p className="text-[#9e978e]">
          {isArabic ? "لم تقم بإضافة منتجات بعد." : "You haven't added any items yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1
        className={`text-3xl sm:text-4xl font-extrabold uppercase text-[#f2ede4] tracking-tight mb-8 ${isArabic ? "font-arabic-heading" : "font-heading"}`}
      >
        {isArabic ? "إتمام الطلب" : "Checkout"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-8">
          {/* Shipping Form */}
          <div className="bg-[#282521] border-2 border-[#3f3b35] p-6 shadow-[6px_6px_0px_#e0562c]">
            <h2 className="text-xl font-heading uppercase text-[#f2ede4] mb-4 border-b border-[#3f3b35] pb-2">
              {isArabic ? "بيانات الشحن" : "Shipping Details"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-[#f2ede4] mb-1.5">
                    {isArabic ? "الاسم الكامل" : "Full Name"}
                  </label>
                  <input
                    required
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="w-full bg-[#1c1a17] border-2 border-[#3f3b35] focus:border-[#e0562c] text-[#f2ede4] px-4 py-2 text-sm outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-[#f2ede4] mb-1.5">
                    {isArabic ? "رقم الهاتف" : "Phone Number"}
                  </label>
                  <input
                    required
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="w-full bg-[#1c1a17] border-2 border-[#3f3b35] focus:border-[#e0562c] text-[#f2ede4] px-4 py-2 text-sm outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#f2ede4] mb-1.5">
                  {isArabic ? "العنوان التفصيلي" : "Detailed Address"}
                </label>
                <textarea
                  required
                  name="shipping_address"
                  value={formData.shipping_address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full bg-[#1c1a17] border-2 border-[#3f3b35] focus:border-[#e0562c] text-[#f2ede4] px-4 py-2 text-sm outline-none transition resize-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#f2ede4] mb-1.5">
                  {isArabic ? "المدينة / المحافظة" : "City / Governorate"}
                </label>
                <input
                  required
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full bg-[#1c1a17] border-2 border-[#3f3b35] focus:border-[#e0562c] text-[#f2ede4] px-4 py-2 text-sm outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* InstaPay Form */}
          <div className="bg-[#1c1a17] border-2 border-[#e0562c] p-6 shadow-[6px_6px_0px_#e0562c]">
            <h2 className="text-xl font-heading uppercase text-[#e0562c] mb-4 border-b border-[#3f3b35] pb-2">
              {isArabic ? "الدفع عبر إنستاباي" : "Pay via InstaPay"}
            </h2>
            <div className="text-sm text-[#f2ede4] mb-6 space-y-2">
              <p>
                {isArabic
                  ? "يرجى تحويل إجمالي المبلغ إلى عنوان إنستاباي التالي:"
                  : "Please transfer the exact total amount to the following InstaPay address:"}
              </p>
              <div className="bg-black p-4 text-center border border-[#3f3b35]">
                <p className="font-heading text-2xl tracking-widest text-[#2ea043]">
                  egyrock@instapay
                </p>
                <p className="mt-2 text-xs text-[#9e978e]">
                  {isArabic ? "رقم الهاتف المربوط: 01000000000" : "Linked Mobile: 01000000000"}
                </p>
              </div>
              <p className="font-bold pt-2 text-[#e0562c]">
                {isArabic
                  ? `المبلغ المطلوب: ${totalPrice} ج.م`
                  : `Amount to send: EGP ${totalPrice}`}
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#f2ede4] mb-1.5">
                {isArabic ? "إرفاق صورة إيصال التحويل" : "Upload Transfer Receipt"}
              </label>
              <input
                required
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
                className="w-full text-sm text-[#9e978e] file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:uppercase file:font-bold file:bg-[#3f3b35] file:text-[#f2ede4] hover:file:bg-[#282521] transition"
              />
              {receiptBase64 && (
                <div className="mt-4">
                  <p className="text-xs text-[#2ea043] font-bold uppercase mb-2">
                    {isArabic ? "تم إرفاق الإيصال بنجاح" : "Receipt uploaded successfully"}
                  </p>
                  <div className="relative w-32 h-48 border border-[#3f3b35]">
                    <Image src={receiptBase64} alt="Receipt" fill className="object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-[#282521] border-2 border-[#3f3b35] p-6 sticky top-24">
            <h2 className="text-xl font-heading uppercase text-[#f2ede4] mb-4 border-b border-[#3f3b35] pb-2">
              {isArabic ? "ملخص الطلب" : "Order Summary"}
            </h2>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-start text-sm">
                  <div className="flex-1 pr-4">
                    <p className="text-[#f2ede4] font-bold">
                      {isArabic ? item.product.name_ar : item.product.name_en}
                    </p>
                    <p className="text-[#9e978e] text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-[#e0562c] font-bold whitespace-nowrap">
                    EGP {item.product.price * item.quantity}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[#3f3b35] pt-4 mb-6">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-[#f2ede4] uppercase">{isArabic ? "الإجمالي" : "Total"}</span>
                <span className="text-[#e0562c]">EGP {totalPrice}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-[#dc2626]/15 border-2 border-[#dc2626] text-[#dc2626] text-xs uppercase font-bold tracking-wider">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 px-4 bg-[#e0562c] hover:bg-[#c44721] text-white font-heading uppercase text-lg tracking-wider transition border-2 border-black shadow-[4px_4px_0px_black] active:translate-y-0.5 active:shadow-[2px_2px_0px_black] cursor-pointer disabled:opacity-60"
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
