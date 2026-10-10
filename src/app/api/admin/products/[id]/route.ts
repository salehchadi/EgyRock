import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateProduct, deleteProduct } from "@/lib/data/products";

function isAdmin(session: any) {
  return session?.user && (session.user as any).role === "admin";
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();

    // Normalize sizes: admin form sends a comma-separated string, accept arrays too.
    let sizes: string[] | undefined;
    if (body.sizes !== undefined) {
      sizes = Array.isArray(body.sizes)
        ? body.sizes.map((s: any) => String(s).trim()).filter(Boolean)
        : String(body.sizes)
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
    }

    let colors: string[] | undefined;
    if (body.colors !== undefined) {
      colors = Array.isArray(body.colors)
        ? body.colors.map((s: any) => String(s).trim()).filter(Boolean)
        : String(body.colors)
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
    }

    const discount_percent =
      body.discount_percent !== undefined
        ? Math.min(100, Math.max(0, Number(body.discount_percent) || 0))
        : undefined;

    const product = await updateProduct(id, {
      ...body,
      price: body.price !== undefined ? Number(body.price) : undefined,
      quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,
      ...(sizes !== undefined ? { sizes } : {}),
      ...(colors !== undefined ? { colors } : {}),
      ...(discount_percent !== undefined ? { discount_percent } : {}),
    });
    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
