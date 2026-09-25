import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/data/coupons";

/**
 * Public endpoint used by the checkout page to preview a coupon discount.
 * The final discount is always recomputed server-side when the order is placed.
 */
export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const amount = Number(subtotal) || 0;
    const result = await validateCoupon(code, amount);

    if (!result.valid) {
      return NextResponse.json({ error: result.error || "Invalid coupon" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: result.coupon!.code,
      discount: result.discount,
      type: result.coupon!.type,
      value: result.coupon!.value,
    });
  } catch (error: any) {
    console.error("[Coupon validate error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate coupon" },
      { status: 500 },
    );
  }
}
