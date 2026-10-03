import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageBySlug } from "@/lib/data/pages";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ locale: string; slug: string }>;

function resolveLang(locale: string): "en" | "ar" | "fr" {
  return (["en", "ar", "fr"].includes(locale) ? locale : "en") as "en" | "ar" | "fr";
}

const DEFAULT_PAGES: Record<
  string,
  {
    title_en: string;
    title_ar: string;
    title_fr: string;
    content_en: string;
    content_ar: string;
    content_fr: string;
  }
> = {
  "how-to-pay": {
    title_en: "How to Pay via InstaPay",
    title_ar: "طريقة الدفع عبر إنستاباي",
    title_fr: "Comment Payer via InstaPay",
    content_en: `1. Select your items and proceed to Checkout.
2. Review your total in EGP (including any applied coupon discount).
3. Open your InstaPay app on your mobile phone.
4. Send the exact total amount to our store handle or payment phone number.
5. Take a clear screenshot of the completed transaction receipt.
6. Upload the receipt screenshot on the checkout page and submit your order.
7. Once our team verifies the payment receipt, your order will be confirmed and prepared for shipping!`,
    content_ar: `١. اختر منتجاتك وانتقل إلى صفحة الدفع.
٢. راجع إجمالي المبلغ بالجنيه المصري (شاملاً الخصم إن وجد).
٣. افتح تطبيق إنستاباي (InstaPay) على هاتفك المحمول.
٤. قم بتحويل المبلغ الإجمالي إلى حساب إنستاباي الخاص بنا أو رقم الهاتف الموضح.
٥. التقط صورة (سكرين شوت) لإيصال المعاملة الناجحة.
٦. ارفع صورة الإيصال في صفحة إتمام الطلب وأكد طلبك.
٧. بمجرد مراجعة الإيصال من قبل الإدارة، سيتم تأكيد طلبك وتجهيزه للشحن فوراً!`,
    content_fr: `1. Sélectionnez vos articles et accédez à la Caisse.
2. Vérifiez votre montant total en EGP.
3. Ouvrez votre application InstaPay sur votre téléphone.
4. Transférez le montant exact vers notre identifiant InstaPay.
5. Prenez une capture d'écran du reçu de transaction.
6. Téléchargez la capture d'écran sur la page de paiement et validez.
7. Dès confirmation du reçu par notre équipe admin, votre commande sera validée!`,
  },
  about: {
    title_en: "About EgyRock",
    title_ar: "عن إيجي روك",
    title_fr: "À Propos d'EgyRock",
    content_en: `EgyRock is Cairo's premier underground music lifestyle and streetwear brand.
Born in the heart of Downtown Cairo, we deliver authentic screen-printed rock apparel, custom gig poster merchandise, and physical guitar & music lesson boxes nationwide across Egypt.`,
    content_ar: `إيجي روك هي العلامة التجارية الأولى لموسيقى الروك والشارع في القاهرة.
تأسست في قلب وسط البلد، وتقدم منتجات أصلية مطبوعة بالشاشة الحريرية، ملابس روك، وحقائب تعليم الموسيقى الملموسة التي تشحن إلى جميع محافظات مصر.`,
    content_fr: `EgyRock est la première marque de streetwear et de musique underground du Caire.
Née au cœur du Caire, nous proposons des vêtements rock sérigraphiés et des coffrets de cours physiques expédiés dans toute l'Égypte.`,
  },
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = resolveLang(locale);
  try {
    const page = await getPageBySlug(slug);
    if (page) {
      return { title: page[`title_${lang}`] || page.title_en };
    }
  } catch {
    // Fall back to default page title if available
  }
  const fallback = DEFAULT_PAGES[slug];
  if (fallback) {
    return { title: fallback[`title_${lang}`] || fallback.title_en };
  }
  return { title: "EgyRock" };
}

export default async function StorefrontCustomPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  const lang = resolveLang(locale);

  let page = await getPageBySlug(slug);

  if (!page && DEFAULT_PAGES[slug]) {
    const def = DEFAULT_PAGES[slug];
    page = {
      id: `DEFAULT-${slug.toUpperCase()}`,
      slug,
      title_en: def.title_en,
      title_ar: def.title_ar,
      title_fr: def.title_fr,
      content_en: def.content_en,
      content_ar: def.content_ar,
      content_fr: def.content_fr,
      is_published: true,
      updated_at: new Date().toISOString(),
    };
  }

  if (!page) notFound();

  const title = page[`title_${lang}`] || page.title_en;
  const content = page[`content_${lang}`] || page.content_en;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1
        className={`text-3xl sm:text-4xl uppercase text-ink tracking-wide font-medium ${
          lang === "ar" ? "font-arabic-heading" : "font-heading"
        }`}
      >
        {title}
      </h1>
      <div className="h-1 w-16 bg-brand mt-3 mb-10" />
      <div
        className={`text-ink-dim leading-relaxed whitespace-pre-wrap ${
          lang === "ar" ? "font-arabic-body text-base sm:text-lg" : "text-sm sm:text-base"
        }`}
        dir={lang === "ar" ? "rtl" : undefined}
      >
        {content || "—"}
      </div>
    </article>
  );
}
