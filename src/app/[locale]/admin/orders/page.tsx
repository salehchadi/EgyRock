import React from "react";
import { getOrders } from "@/lib/data/orders";
import AdminOrdersClient from "./AdminOrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const orders = await getOrders();

  return <AdminOrdersClient orders={orders} locale={locale} />;
}
