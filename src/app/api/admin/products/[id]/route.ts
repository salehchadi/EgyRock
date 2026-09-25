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

    const product = await updateProduct(id, {
      ...body,
      price: Number(body.price),
      quantity: Number(body.quantity),
      ...(sizes !== undefined ? { sizes } : {}),
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
