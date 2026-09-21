import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomepageImages, addHomepageImage } from "@/lib/data/homepageImages";

function isAdmin(s: any) {
  return s?.user && (s.user as any).role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const images = await getHomepageImages();
    return NextResponse.json({ images });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.image_url) {
      return NextResponse.json({ error: "image_url is required" }, { status: 400 });
    }
    const image = await addHomepageImage({
      image_url: body.image_url,
      link_url: body.link_url || undefined,
      title_en: body.title_en || undefined,
      title_ar: body.title_ar || undefined,
      sort_order: Number(body.sort_order) || 1,
    });
    return NextResponse.json({ image }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
