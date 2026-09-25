import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createOrder } from "@/lib/data/orders";
import { validateCoupon, incrementCouponUsage } from "@/lib/data/coupons";
import { CartItem } from "@/components/providers/CartProvider";
import type { OrderItem } from "@/types";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || "guest";

    const body = await req.json();
    const { customer_name, customer_phone, shipping_address, items, receipt_image_url } = body;
    const couponCode: string = typeof body.coupon_code === "string" ? body.coupon_code : "";

    if (!customer_name || !customer_phone || !shipping_address) {
      return NextResponse.json({ error: "Missing required shipping information" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    if (!receipt_image_url) {
      return NextResponse.json({ error: "Payment receipt is required" }, { status: 400 });
    }

    // Calculate subtotal from items (CartItem shape: { product: Product, quantity, size? })
    let subtotal = 0;
    const orderItems: OrderItem[] = [];
    for (const item of items as CartItem[]) {
      if (!item?.product?.id || !item.quantity || item.quantity < 1) continue;
      subtotal += item.product.price * item.quantity;
      orderItems.push({
        product_id: item.product.id,
        name: item.product.name_en,
        quantity: item.quantity,
        unit_price: item.product.price,
        size: item.size || "",
      });
    }

    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one valid item" },
        { status: 400 },
      );
    }

    // Validate the coupon server-side and recompute the discount (never trust the client).
    let discount = 0;
    let appliedCouponCode = "";
    if (couponCode.trim()) {
      const validation = await validateCoupon(couponCode, subtotal);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error || "Invalid coupon" }, { status: 400 });
      }
      discount = validation.discount || 0;
      appliedCouponCode = validation.coupon!.code;
      await incrementCouponUsage(validation.coupon!.id);
    }

    const total = Math.max(0, subtotal - discount);

    const order = await createOrder({
      user_id: userId,
      customer_name,
      customer_phone,
      shipping_address,
      items: orderItems,
      total,
      receipt_image_url,
      coupon_code: appliedCouponCode,
      discount,
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
