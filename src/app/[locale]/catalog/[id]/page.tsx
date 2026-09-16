import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getProductById, getProductsByCategory } from "@/lib/data/products";
import { getCategoryById } from "@/lib/data/categories";
import { calculateStockStatus } from "@/lib/stock";
import { PosterBadge } from "@/components/ui/PosterBadge";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { ProductImageGallery } from "@/components/catalog/ProductImageGallery";

export const revalidate = 0;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const product = await getProductById(id);
  if (!product) {
    notFound();
  }

  const isArabic = locale === "ar";
  const isFrench = locale === "fr";
  const stock = calculateStockStatus(product.quantity);
  // Localized text
  const title = isArabic
    ? product.name_ar || product.name_en
    : isFrench
      ? product.name_fr || product.name_en
      : product.name_en;

  const desc = isArabic
    ? product.desc_ar || product.desc_en
    : isFrench
      ? product.desc_fr || product.desc_en
      : product.desc_en;

  // Category info
  const category = await getCategoryById(product.category_id);
  const categoryName = category
    ? isArabic
      ? category.name_ar || category.name_en
      : isFrench
        ? category.name_fr || category.name_en
        : category.name_en
    : product.category_id;

  // Related products (same category, exclude current)
  const relatedProducts = (await getProductsByCategory(product.category_id))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  // Product images with fallback
  const productImages = Array.isArray(product.images)
    ? product.images
    : product.images
      ? [product.images]
      : [];
  const images = productImages.length > 0 ? productImages : ["/images/placeholders/egyrock-1.jpeg"];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs uppercase font-mono text-[#9e978e]">
        <Link href="/" className="hover:text-[#f2ede4] transition">
          {isArabic ? "الرئيسية" : isFrench ? "Accueil" : "HOME"}
        </Link>
        <span className="text-[#3f3b35]">/</span>
        <Link href="/catalog" className="hover:text-[#f2ede4] transition">
          {isArabic ? "الكتالوج" : isFrench ? "Catalogue" : "CATALOG"}
        </Link>
        <span className="text-[#3f3b35]">/</span>
        <Link
          href={`/catalog?category=${product.category_id}`}
          className="hover:text-[#f2ede4] transition text-[#e0562c]"
        >
          {categoryName}
        </Link>
        <span className="text-[#3f3b35]">/</span>
        <span className="text-[#f2ede4] truncate max-w-[200px]">{title}</span>
      </nav>

      {/* Product Main Section */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Image Gallery */}
        <ProductImageGallery images={images} title={title} />

        {/* Right: Product Info */}
        <div className="space-y-6">
          {/* Category Tag */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#e0562c] uppercase font-bold tracking-[0.25em] bg-[#e0562c]/10 border border-[#e0562c]/30 px-2 py-0.5">
              {categoryName}
            </span>
          </div>

          {/* Title */}
          <h1
            className={`text-3xl sm:text-4xl lg:text-5xl uppercase text-[#f2ede4] leading-tight ${
              isArabic ? "font-arabic-heading font-bold" : "font-heading"
            }`}
          >
            {title}
          </h1>

          {/* Stock Badge */}
          <div className="flex items-center gap-4">
            <PosterBadge
              status={stock.status}
              quantity={stock.quantity}
              locale={locale}
              size="md"
            />
            {stock.status === "countdown" && (
              <span className="text-xs text-[#d97706] font-mono animate-pulse">
                {isArabic ? "اطلب الآن!" : "ORDER NOW!"}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="bg-[#282521] border-2 border-[#3f3b35] p-4 inline-flex items-baseline gap-3">
            <span className="text-xs text-[#9e978e] uppercase font-mono">
              {isArabic ? "السعر" : isFrench ? "Prix" : "PRICE"}
            </span>
            <span
              className={`text-3xl sm:text-4xl text-[#f2ede4] ${
                isArabic ? "font-arabic-heading font-bold" : "font-heading"
              }`}
            >
              {product.price}
            </span>
            <span className="text-sm text-[#9e978e] font-mono">{isArabic ? "ج.م" : "EGP"}</span>
          </div>

          {/* Description */}
          <div className="border-t border-[#3f3b35] pt-5">
            <h2
              className={`text-xs uppercase tracking-[0.2em] text-[#9e978e] mb-3 ${
                isArabic ? "font-arabic-heading" : "font-heading"
              }`}
            >
              {isArabic ? "الوصف" : isFrench ? "Description" : "DESCRIPTION"}
            </h2>
            <p className="text-sm sm:text-base text-[#c5beaf] leading-relaxed whitespace-pre-line">
              {desc}
            </p>
          </div>

          {/* Add to Cart Section */}
          <div className="border-t border-[#3f3b35] pt-6">
            <AddToCartButton product={product} />
          </div>

          {/* Shipping & Payment Callout */}
          <div className="bg-[#282521] border border-[#3f3b35] p-4 space-y-3 bg-screen-print">
            <div className="flex items-start gap-3">
              <span className="text-[#e0562c] text-lg mt-0.5">📦</span>
              <div>
                <p className="text-xs font-bold uppercase text-[#f2ede4] tracking-wider">
                  {isArabic
                    ? "شحن مادي في جميع أنحاء مصر"
                    : isFrench
                      ? "Livraison physique partout en Égypte"
                      : "PHYSICAL SHIPPING ACROSS EGYPT"}
                </p>
                <p className="text-[11px] text-[#9e978e] mt-1">
                  {isArabic
                    ? "جميع الطلبات تشحن عبر خدمة البريد السريع. وقت التسليم: 3-7 أيام عمل."
                    : isFrench
                      ? "Toutes les commandes sont expédiées par courrier express. Délai : 3-7 jours ouvrables."
                      : "All orders shipped via express courier. Delivery: 3-7 business days."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-[#3f3b35] pt-3">
              <span className="text-[#e0562c] text-lg mt-0.5">💳</span>
              <div>
                <p className="text-xs font-bold uppercase text-[#f2ede4] tracking-wider">
                  {isArabic
                    ? "الدفع عبر InstaPay"
                    : isFrench
                      ? "Paiement via InstaPay"
                      : "PAY VIA INSTAPAY"}
                </p>
                <p className="text-[11px] text-[#9e978e] mt-1">
                  {isArabic
                    ? "أرسل المبلغ إلى egyrock@instapay ثم ارفع لقطة شاشة الإيصال أثناء الدفع."
                    : isFrench
                      ? "Envoyez le montant à egyrock@instapay puis téléchargez la capture d'écran du reçu."
                      : "Send amount to egyrock@instapay then upload receipt screenshot at checkout."}
                </p>
                <p className="text-[11px] text-[#e0562c] font-bold mt-1 font-mono">
                  egyrock@instapay
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t-2 border-[#3f3b35] pt-10 space-y-6">
          <div className="flex items-center justify-between">
            <h2
              className={`text-2xl sm:text-3xl uppercase text-[#f2ede4] ${
                isArabic ? "font-arabic-heading font-bold" : "font-heading"
              }`}
            >
              {isArabic
                ? "منتجات مشابهة"
                : isFrench
                  ? "Produits similaires"
                  : "MORE FROM THIS CATEGORY"}
            </h2>
            <Link
              href={`/catalog?category=${product.category_id}`}
              className="text-xs uppercase font-heading tracking-wider text-[#e0562c] border border-[#e0562c] px-3 py-1.5 hover:bg-[#e0562c] hover:text-white transition hidden sm:block"
            >
              {isArabic ? "عرض الكل" : isFrench ? "Voir tout" : "VIEW ALL"}
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map((rp) => {
              const rpStock = calculateStockStatus(rp.quantity);
              const rpIsOut = rpStock.status === "out_of_stock";
              const rpTitle = isArabic
                ? rp.name_ar || rp.name_en
                : isFrench
                  ? rp.name_fr || rp.name_en
                  : rp.name_en;
              const rpImage = rp.images?.[0] || "/images/placeholders/egyrock-1.jpeg";

              return (
                <Link
                  key={rp.id}
                  href={`/catalog/${rp.id}`}
                  className={`underground-card p-3 group transition-all block ${
                    rpIsOut ? "opacity-60 grayscale-[35%]" : ""
                  }`}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-[#141210] border border-[#3f3b35] mb-3">
                    <Image
                      src={rpImage}
                      alt={rpTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 z-10">
                      <PosterBadge
                        status={rpStock.status}
                        quantity={rpStock.quantity}
                        locale={locale}
                        size="sm"
                      />
                    </div>
                  </div>
                  <h3
                    className={`text-sm uppercase text-[#f2ede4] group-hover:text-[#e0562c] transition leading-snug line-clamp-2 mb-1 ${
                      isArabic ? "font-arabic-heading font-bold" : "font-heading"
                    }`}
                  >
                    {rpTitle}
                  </h3>
                  <span className="font-heading text-base text-[#e0562c]">
                    {rp.price} {isArabic ? "ج.م" : "EGP"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Back to catalog link */}
      <div className="text-center pt-4">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-xs uppercase font-heading tracking-wider text-[#9e978e] hover:text-[#f2ede4] transition border border-[#3f3b35] px-5 py-2.5 hover:border-[#f2ede4]"
        >
          <span className="rtl:rotate-180">←</span>
          {isArabic ? "العودة إلى الكتالوج" : isFrench ? "Retour au catalogue" : "BACK TO CATALOG"}
        </Link>
      </div>
    </div>
  );
}
