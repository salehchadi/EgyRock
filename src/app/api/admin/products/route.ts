import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getProducts, createProduct } from "@/lib/data/products";

function isAdmin(session: any) {
  return session?.user && (session.user as any).role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      name_en,
      name_ar,
      name_fr,
      desc_en,
      desc_ar,
      desc_fr,
      price,
      quantity,
      category_id,
      images,
      sizes,
    } = body;

    if (!name_en || !category_id) {
      return NextResponse.json({ error: "Name (EN) and category are required" }, { status: 400 });
    }

    const product = await createProduct({
      id: `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name_en,
      name_ar: name_ar || name_en,
      name_fr: name_fr || name_en,
      desc_en: desc_en || "",
      desc_ar: desc_ar || "",
      desc_fr: desc_fr || "",
      price: Number(price) || 0,
      quantity: Number(quantity) || 0,
      category_id,
      images: images || [],
      sizes: Array.isArray(sizes)
        ? sizes.map((s: any) => String(s).trim()).filter(Boolean)
        : typeof sizes === "string"
          ? sizes
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
