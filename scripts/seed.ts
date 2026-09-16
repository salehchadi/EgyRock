/**
 * Seed script for EgyRock
 * Populates Google Sheets with sample data for development
 */

import { createCategory } from "../lib/data/categories";
import { createProduct } from "../lib/data/products";
import { createHomepageImage } from "../lib/data/homepageImages";
import { createTranslation } from "../lib/data/translations";
import { createUser } from "../lib/data/users";
import bcrypt from "bcryptjs";

// Sample categories
const CATEGORIES = [
  {
    id: "courses",
    name_en: "Courses",
    name_ar: "دورات",
    name_fr: "Cours",
  },
  {
    id: "t-shirts",
    name_en: "T-shirts",
    name_ar: "تيشيرتات",
    name_fr: "T-shirts",
  },
  {
    id: "mugs",
    name_en: "Mugs",
    name_ar: "أكواب",
    name_fr: "Tasses",
  },
  {
    id: "accessories",
    name_en: "Accessories",
    name_ar: "إكسسوارات",
    name_fr: "Accessoires",
  },
];

// Sample products
const PRODUCTS = [
  // Courses
  {
    category_id: "courses",
    name_en: "Guitar Basics Complete Kit",
    name_ar: "أساسيات الجيتار - مجموعة كاملة",
    name_fr: "Kit complet de bases de guitare",
    desc_en:
      "Complete beginner guitar course with physical workbook, instructional USB, and practice chord cards.",
    desc_ar: "دورة جيتار للمبتدئين تشمل كتاب تدريبي مادي، يو إس بي تعليمي، وبطاقات أكوراد للتدريب.",
    desc_fr:
      "Cours de guitare pour débutants complet avec cahier physique, USB instructif et cartes d'accords.",
    price: 450,
    quantity: 15,
    images: ["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400"],
  },
  {
    category_id: "courses",
    name_en: "Drum Fundamentals Box",
    name_ar: "أساسيات الطبول - صندوق",
    name_fr: "Boîte de fondamentaux de batterie",
    desc_en:
      "Physical drum learning kit with rhythm charts, stick technique guide, and practice pad.",
    desc_ar: "مجموعة تعلم الطبول تشمل مخططات إيقاع، دليل تقنية العصي، ووسادة تدريب.",
    desc_fr:
      "Kit d'apprentissage de la batterie physique avec graphiques rythmiques, guide de technique de baguettes et tampon de pratique.",
    price: 380,
    quantity: 8,
    images: ["https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400"],
  },
  // T-shirts
  {
    category_id: "t-shirts",
    name_en: "Cairo Underground Graphic Tee",
    name_ar: "تيشيرت القاهرة تحت الأرض",
    name_fr: "T-shirt graphique Cairo Underground",
    desc_en: "Premium cotton tee with authentic Cairo underground rock scene artwork.",
    desc_ar: "تيشيرت قطني فاخر بتصميم فني لمشهد روك القاهرة تحت الأرض.",
    desc_fr:
      "T-shirt en coton premium avec artwork authentique de la scène rock underground du Caire.",
    price: 180,
    quantity: 25,
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"],
  },
  {
    category_id: "t-shirts",
    name_en: "Desert Rock Festival Tee",
    name_ar: "تيشيرت مهرجان الصحراء روك",
    name_fr: "T-shirt Festival Desert Rock",
    desc_en: "Limited edition festival tee featuring Egyptian desert rock aesthetic.",
    desc_ar: "تيشيرت مهرجان محدود الإصدار بتصميم روك صحراوي مصري.",
    desc_fr: "T-shirt de festival édition limitée avec esthétique rock du désert égyptien.",
    price: 200,
    quantity: 12,
    images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400"],
  },
  {
    category_id: "t-shirts",
    name_en: "Pyramid Amplifier Logo",
    name_ar: "شعار مضخم الصوت الأهرامات",
    name_fr: "Logo Amplificateur Pyramide",
    desc_en: "Classic amplifier logo with pyramid motif, heavy cotton.",
    desc_ar: "شعار كلاسيكي لمضخم صوت بزخرفة الأهرامات، قطن ثقيل.",
    desc_fr: "Logo d'amplificateur classique avec motif pyramide, coton lourd.",
    price: 165,
    quantity: 30,
    images: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400"],
  },
  // Mugs
  {
    category_id: "mugs",
    name_en: "Nile Rock Coffee Mug",
    name_ar: "كوب قهوة نيل روك",
    name_fr: "Tasse à café Nile Rock",
    desc_en: "Ceramic mug with Nile river and guitar bridge design.",
    desc_ar: "كوب سيراميك بتصميم نهر النيل وجسر الجيتار.",
    desc_fr: "Tasse en céramique avec design du Nil et pont de guitare.",
    price: 85,
    quantity: 20,
    images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400"],
  },
  {
    category_id: "mugs",
    name_en: "Pharaoh Riffs Mug",
    name_ar: "كوب ريفات الفراعنة",
    name_fr: "Tasse Riffs du Pharaon",
    desc_en: "Bold mug featuring pharaoh with electric guitar artwork.",
    desc_ar: "كوب جريء يعرض فرعونا مع تصميم جيتار كهربائي.",
    desc_fr: "Tasse audacieuse présentant un pharaon avec artwork de guitare électrique.",
    price: 95,
    quantity: 18,
    images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400"],
  },
  // Accessories
  {
    category_id: "accessories",
    name_en: "Egyptian Guitar Strap",
    name_ar: "حزام جيتار مصري",
    name_fr: "Sangle de guitare égyptienne",
    desc_en: "Handwoven guitar strap with traditional Egyptian patterns.",
    desc_ar: "حزام جيتار منسوج يدوياً بأنماط مصرية تقليدية.",
    desc_fr: "Sangle de guitare tissée à la main avec motifs égyptiens traditionnels.",
    price: 120,
    quantity: 10,
    images: ["https://images.unsplash.com/photo-1550985543-f47f384b90c0?w=400"],
  },
  {
    category_id: "accessories",
    name_en: "Cairo Patch Set",
    name_ar: "مجموعة باتشات القاهرة",
    name_fr: "Ensemble de patchs Cairo",
    desc_en: "Set of 5 iron-on patches featuring Cairo underground band logos.",
    desc_ar: "مجموعة من 5 باتشات قابلة للكي تضم شعارات فرق القاهرة تحت الأرض.",
    desc_fr:
      "Ensemble de 5 patchs à repasser présentant des logos de groupes underground du Caire.",
    price: 65,
    quantity: 35,
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
  },
];

// Sample homepage images
const HOMEPAGE_IMAGES = [
  {
    image_url: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=1200",
    link_url: "/catalog",
    title_en: "Rock Your Sound",
    title_ar: "عشق صوتك",
    sort_order: 1,
  },
  {
    image_url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200",
    link_url: "/catalog?category=courses",
    title_en: "Learn With Physical Kits",
    title_ar: "تعلم بمجموعات مادية",
    sort_order: 2,
  },
  {
    image_url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=1200",
    link_url: "/catalog?category=t-shirts",
    title_en: "Wear The Underground",
    title_ar: "ارتدي تحت الأرض",
    sort_order: 3,
  },
];

// Sample translations
const TRANSLATIONS = [
  { key: "nav.home", en: "Home", ar: "الرئيسية", fr: "Accueil" },
  { key: "nav.catalog", en: "Catalog", ar: "الكتالوج", fr: "Catalogue" },
  { key: "nav.cart", en: "Cart", ar: "السلة", fr: "Panier" },
  { key: "nav.account", en: "Account", ar: "حسابي", fr: "Compte" },
  { key: "nav.login", en: "Login", ar: "تسجيل الدخول", fr: "Connexion" },
  { key: "nav.register", en: "Register", ar: "تسجيل", fr: "S'inscrire" },
  { key: "nav.logout", en: "Logout", ar: "تسجيل الخروج", fr: "Déconnexion" },
  { key: "common.add_to_cart", en: "Add to Cart", ar: "أضف للسلة", fr: "Ajouter au panier" },
  { key: "common.out_of_stock", en: "Out of stock", ar: "نفدت الكمية", fr: "Rupture de stock" },
  { key: "common.in_stock", en: "In stock", ar: "متوفر", fr: "En stock" },
  {
    key: "common.only_x_left",
    en: "Only {count} left",
    ar: "متبقي {count} فقط",
    fr: "Plus que {count} restants",
  },
  { key: "common.price", en: "Price", ar: "السعر", fr: "Prix" },
  { key: "common.egp", en: "EGP", ar: "ج.م", fr: "EGP" },
  { key: "common.view_details", en: "View Details", ar: "عرض التفاصيل", fr: "Voir les détails" },
  {
    key: "hero.shop_by_category",
    en: "Shop by Category",
    ar: "تسوق حسب الفئة",
    fr: "Acheter par catégorie",
  },
  {
    key: "hero.featured_products",
    en: "Featured Products",
    ar: "منتجات مميزة",
    fr: "Produits en vedette",
  },
  { key: "cart.title", en: "Your Cart", ar: "سلتك", fr: "Votre panier" },
  { key: "cart.empty", en: "Your cart is empty", ar: "سلتك فارغة", fr: "Votre panier est vide" },
  { key: "cart.total", en: "Total", ar: "المجموع", fr: "Total" },
  { key: "cart.checkout", en: "Checkout", ar: "إتمام الشراء", fr: "Passer la commande" },
  { key: "checkout.title", en: "Checkout", ar: "إتمام الشراء", fr: "Commande" },
  {
    key: "checkout.shipping_details",
    en: "Shipping Details",
    ar: "تفاصيل الشحن",
    fr: "Détails de livraison",
  },
  { key: "checkout.name", en: "Full Name", ar: "الاسم الكامل", fr: "Nom complet" },
  { key: "checkout.phone", en: "Phone Number", ar: "رقم الهاتف", fr: "Numéro de téléphone" },
  {
    key: "checkout.address",
    en: "Shipping Address",
    ar: "عنوان الشحن",
    fr: "Adresse de livraison",
  },
  { key: "checkout.payment", en: "Payment", ar: "الدفع", fr: "Paiement" },
  {
    key: "checkout.instapay_instructions",
    en: "Send payment via InstaPay to:",
    ar: "أرسل الدفع عبر إنستا باي إلى:",
    fr: "Envoyez le paiement via InstaPay à:",
  },
  {
    key: "checkout.upload_receipt",
    en: "Upload Receipt",
    ar: "رفع الإيصال",
    fr: "Télécharger le reçu",
  },
  { key: "checkout.place_order", en: "Place Order", ar: "تأكيد الطلب", fr: "Passer la commande" },
  {
    key: "order.confirmation",
    en: "Order Confirmation",
    ar: "تأكيد الطلب",
    fr: "Confirmation de commande",
  },
  {
    key: "order.thank_you",
    en: "Thank you for your order!",
    ar: "شكراً لطلبك!",
    fr: "Merci pour votre commande!",
  },
  { key: "order.id", en: "Order ID", ar: "رقم الطلب", fr: "ID de commande" },
  { key: "order.status", en: "Status", ar: "الحالة", fr: "Statut" },
  {
    key: "order.pending_payment",
    en: "Pending payment",
    ar: "في انتظار الدفع",
    fr: "Paiement en attente",
  },
  { key: "order.confirmed", en: "Confirmed", ar: "مؤكد", fr: "Confirmé" },
  { key: "order.rejected", en: "Rejected", ar: "مرفوض", fr: "Rejeté" },
];

async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  try {
    // Seed categories
    console.log("📁 Seeding categories...");
    for (const category of CATEGORIES) {
      await createCategory(category);
      console.log(`  ✅ Created category: ${category.name_en}`);
    }

    // Seed products
    console.log("🎸 Seeding products...");
    for (const product of PRODUCTS) {
      await createProduct(product);
      console.log(`  ✅ Created product: ${product.name_en}`);
    }

    // Seed homepage images
    console.log("🖼️  Seeding homepage images...");
    for (const image of HOMEPAGE_IMAGES) {
      await createHomepageImage(image);
      console.log(`  ✅ Created homepage image: ${image.title_en}`);
    }

    // Seed translations
    console.log("🌍 Seeding translations...");
    for (const translation of TRANSLATIONS) {
      await createTranslation(translation, translation.key);
      console.log(`  ✅ Created translation: ${translation.key}`);
    }

    // Seed admin user
    console.log("👤 Seeding admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await createUser({
      email: "admin@egyrock.com",
      password_hash: hashedPassword,
      name: "Admin User",
      role: "admin",
    });
    console.log("  ✅ Created admin user (email: admin@egyrock.com, password: admin123)");

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed
seedDatabase();
