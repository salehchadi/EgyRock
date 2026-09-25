import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateCoupon, deleteCoupon } from "@/lib/data/coupons";

function isAdmin(session: any) {
  return session?.user && (session.user as any).role === "admin";
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const updates: Record<string, any> = {};
    if (body.code !== undefined) updates.code = body.code;
    if (body.type !== undefined) updates.type = body.type;
    if (body.value !== undefined) updates.value = Number(body.value);
    if (body.min_order !== undefined) updates.min_order = Number(body.min_order);
    if (body.active !== undefined) updates.active = body.active === true || body.active === "true";
    if (body.usage_limit !== undefined) updates.usage_limit = Number(body.usage_limit);
    if (body.expires_at !== undefined) updates.expires_at = body.expires_at;

    const coupon = await updateCoupon(id, updates);
    return NextResponse.json({ coupon });
  } catch (error: any) {
    const status = /not found|greater|exceed|required/i.test(error.message || "") ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await deleteCoupon(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = /not found/i.test(error.message || "") ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
