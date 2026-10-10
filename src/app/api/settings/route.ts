import { NextResponse } from "next/server";
import { getSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json(
      {
        settings: {
          instapay_handle: "egyrock@instapay",
          instapay_link: "https://ipn.eg/egyrock",
          instapay_phone: "01000000000",
        },
      },
      { status: 200 },
    );
  }
}
