import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCoupons, createCoupon } from "@/lib/data/coupons";

function isAdmin(session: any) {
  return session?.user && (session.user as any).role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const coupons = await getCoupons();
  return NextResponse.json({ coupons });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const coupon = await createCoupon({
      code: body.code,
      type: body.type,
      value: Number(body.value),
      min_order: Number(body.min_order) || 0,
      active: body.active !== false,
      usage_limit: Number(body.usage_limit) || 0,
      expires_at: body.expires_at || "",
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: any) {
    const status = /already exists|required|greater|exceed/i.test(error.message || "") ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
