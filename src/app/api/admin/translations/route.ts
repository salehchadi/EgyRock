import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTranslations, upsertTranslation } from "@/lib/data/translations";

function isAdmin(s: any) {
  return s?.user && (s.user as any).role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json({ translations: await getTranslations() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }
    const record = await upsertTranslation(body.key, {
      en: body.en,
      ar: body.ar,
      fr: body.fr,
    });
    return NextResponse.json({ translation: record });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
