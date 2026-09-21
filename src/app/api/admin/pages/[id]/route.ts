import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updatePage, deletePage } from "@/lib/data/pages";

function isAdmin(s: any) {
  return s?.user && (s.user as any).role === "admin";
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const page = await updatePage(id, {
      slug: body.slug
        ? String(body.slug)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, "-")
        : undefined,
      title_en: body.title_en,
      title_ar: body.title_ar,
      title_fr: body.title_fr,
      content_en: body.content_en,
      content_ar: body.content_ar,
      content_fr: body.content_fr,
      is_published: body.is_published !== undefined ? Boolean(body.is_published) : undefined,
    });
    return NextResponse.json({ page });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    await deletePage(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
