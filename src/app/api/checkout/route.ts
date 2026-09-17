import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createOrder } from "@/lib/data/orders";
import { CartItem } from "@/components/providers/CartProvider";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || "guest";

    const body = await req.json();
    const { customer_name, customer_phone, shipping_address, items, receipt_image_url } = body;

    if (!customer_name || !customer_phone || !shipping_address) {
      return NextResponse.json({ error: "Missing required shipping information" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    if (!receipt_image_url) {
      return NextResponse.json({ error: "Payment receipt is required" }, { status: 400 });
    }

    // Calculate total from items (CartItem shape: { product: Product, quantity: number })
    let total = 0;
    for (const item of items as CartItem[]) {
      total += item.product.price * item.quantity;
    }

    const order = await createOrder({
      user_id: userId,
      customer_name,
      customer_phone,
      shipping_address,
      items,
      total,
      receipt_image_url,
    });

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process checkout" },
      { status: 500 },
    );
  }
}
