import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPages, createPage } from "@/lib/data/pages";

function isAdmin(s: any) {
  return s?.user && (s.user as any).role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json({ pages: await getPages() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.slug || !body.title_en) {
      return NextResponse.json({ error: "slug and title_en are required" }, { status: 400 });
    }
    const page = await createPage({
      slug: String(body.slug)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, "-"),
      title_en: body.title_en,
      title_ar: body.title_ar || "",
      title_fr: body.title_fr || "",
      content_en: body.content_en || "",
      content_ar: body.content_ar || "",
      content_fr: body.content_fr || "",
      is_published: Boolean(body.is_published),
    });
    return NextResponse.json({ page }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
