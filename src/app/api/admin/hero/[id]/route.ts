import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateHomepageImage, deleteHomepageImage } from "@/lib/data/homepageImages";

function isAdmin(s: any) {
  return s?.user && (s.user as any).role === "admin";
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const image = await updateHomepageImage(id, {
      image_url: body.image_url,
      link_url: body.link_url,
      title_en: body.title_en,
      title_ar: body.title_ar,
      sort_order: body.sort_order !== undefined ? Number(body.sort_order) : undefined,
    });
    return NextResponse.json({ image });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    await deleteHomepageImage(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
