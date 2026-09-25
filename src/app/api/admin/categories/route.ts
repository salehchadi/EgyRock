import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCategories, createCategory } from "@/lib/data/categories";

function isAdmin(s: any) {
  return s?.user && (s.user as any).role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ categories: await getCategories() });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.name_en) return NextResponse.json({ error: "Name (EN) required" }, { status: 400 });
    const category = await createCategory({
      id: body.name_en.toLowerCase().replace(/\s+/g, "-"),
      name_en: body.name_en,
      name_ar: body.name_ar || body.name_en,
      name_fr: body.name_fr || body.name_en,
      parent_id: body.parent_id || "",
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
