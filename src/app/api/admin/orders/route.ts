import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getOrders } from "@/lib/data/orders";

function isAdmin(s: any) {
  return s?.user && (s.user as any).role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const orders = await getOrders();
  return NextResponse.json({ orders });
}
