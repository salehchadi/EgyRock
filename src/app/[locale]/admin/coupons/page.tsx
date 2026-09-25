import React from "react";
import { getCoupons } from "@/lib/data/coupons";
import AdminCouponsClient from "./AdminCouponsClient";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const coupons = await getCoupons();

  return <AdminCouponsClient coupons={coupons} locale={locale} />;
}
