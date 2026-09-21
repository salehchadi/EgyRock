"use client";

import React, { useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/types";

interface Props {
  orders: Order[];
  locale: string;
}

type Filter = "All" | OrderStatus;

const FILTERS: Filter[] = ["All", "Pending payment", "Confirmed", "Rejected"];

function StatusBadge({ status }: { status: OrderStatus }) {
  if (status === "Confirmed") {
    return <span className="admin-status-confirmed">Confirmed</span>;
  }
  if (status === "Rejected") {
    return <span className="admin-status-rejected">Rejected</span>;
  }
  return <span className="admin-status-pending">Pending payment</span>;
}

export default function AdminOrdersClient({ orders: initialOrders, locale }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<Filter>("All");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [receiptView, setReceiptView] = useState<Order | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "All") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const pendingCount = orders.filter((o) => o.status === "Pending payment").length;

  const setStatus = async (order: Order, status: OrderStatus) => {
    const warn =
      status === "Confirmed"
        ? `Confirm order ${order.id}?\n\nThis will DECREMENT stock for each item and mark the payment as verified.`
        : `Reject order ${order.id}? Stock will remain untouched.`;
    if (!confirm(warn)) return;

    setBusyId(order.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <a
          href={`/${locale}/admin`}
          className="text-xs text-[#9e978e] hover:text-[#e0562c] uppercase tracking-widest"
        >
          ← Dashboard
        </a>
        <h1 className="text-3xl font-heading uppercase text-[#f2ede4] mt-1">
          Orders
          {pendingCount > 0 && (
            <span className="ml-3 align-middle text-xs bg-[#d97706] text-black px-2 py-1 font-bold uppercase tracking-wider">
              {pendingCount} Pending
            </span>
          )}
        </h1>
      </div>

      {error && (
        <div className="p-3 bg-[#dc2626]/15 border border-[#dc2626] text-[#dc2626] text-xs uppercase font-bold">
          {error}
        </div>
      )}

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs uppercase font-heading tracking-wider border-2 transition ${
              filter === f
                ? "border-[#e0562c] bg-[#e0562c] text-white"
                : "border-[#3f3b35] text-[#9e978e] hover:border-[#f2ede4] hover:text-[#f2ede4]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filtered.map((order) => (
          <div key={order.id} className="underground-card border-2 !border-[#3f3b35] p-5 space-y-4">
            {/* Row 1: meta */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm text-[#e0562c] font-bold">{order.id}</span>
                <StatusBadge status={order.status} />
                <span className="text-xs text-[#9e978e]">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>
              <span className="font-heading text-xl text-[#f2ede4]">
                {order.total.toFixed(2)} EGP
              </span>
            </div>

            {/* Row 2: customer */}
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="label-field">Customer</span>
                <span className="text-[#f2ede4]">{order.customer_name}</span>
              </div>
              <div>
                <span className="label-field">Phone</span>
                <span className="text-[#f2ede4]" dir="ltr">
                  {order.customer_phone}
                </span>
              </div>
              <div>
                <span className="label-field">Address</span>
                <span className="text-[#f2ede4]">{order.shipping_address}</span>
              </div>
            </div>

            {/* Row 3: items (expandable) */}
            <div>
              <button
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                className="text-xs uppercase font-heading tracking-wider text-[#9e978e] hover:text-[#e0562c] transition"
              >
                {expandedId === order.id ? "▼ Hide items" : "▶ Show items"} ({order.items.length})
              </button>
              {expandedId === order.id && (
                <table className="w-full text-sm mt-3 border border-[#3f3b35]">
                  <thead>
                    <tr className="text-xs uppercase text-[#9e978e] border-b border-[#3f3b35]">
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-right px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Unit</th>
                      <th className="text-right px-3 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#3f3b35]/50">
                        <td className="px-3 py-2 text-[#f2ede4]">{item.name}</td>
                        <td className="px-3 py-2 text-right text-[#f2ede4]">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-[#9e978e]">
                          {item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-[#f2ede4]">
                          {(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Row 4: receipt + actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#3f3b35]">
              <button
                onClick={() => setReceiptView(order)}
                className="text-xs px-4 py-2 border border-[#3f3b35] hover:border-[#e0562c] text-[#f2ede4] uppercase font-heading tracking-wider transition"
              >
                🧾 View Receipt
              </button>

              {order.status === "Pending payment" ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStatus(order, "Confirmed")}
                    disabled={busyId === order.id}
                    className="px-5 py-2 bg-[#2ea043] hover:bg-[#279039] text-white font-heading uppercase text-sm tracking-wider border-2 border-black shadow-[3px_3px_0px_black] transition disabled:opacity-50"
                  >
                    {busyId === order.id ? "..." : "✓ Confirm"}
                  </button>
                  <button
                    onClick={() => setStatus(order, "Rejected")}
                    disabled={busyId === order.id}
                    className="admin-btn-danger"
                  >
                    ✗ Reject
                  </button>
                </div>
              ) : (
                <span className="text-xs text-[#9e978e] uppercase tracking-wider">
                  {order.confirmed_at
                    ? `Processed ${new Date(order.confirmed_at).toLocaleString()}`
                    : "No further action"}
                </span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center py-12 text-[#9e978e] uppercase font-heading">
            No orders in this status.
          </p>
        )}
      </div>

      {/* Receipt Modal */}
      {receiptView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setReceiptView(null)}
        >
          <div
            className="bg-[#282521] border-2 border-[#e0562c] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-[8px_8px_0_#e0562c]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading uppercase text-[#f2ede4]">
                Receipt — {receiptView.id}
              </h2>
              <button
                onClick={() => setReceiptView(null)}
                className="text-[#9e978e] hover:text-[#f2ede4] text-xl leading-none"
              >
                ×
              </button>
            </div>
            {receiptView.receipt_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={receiptView.receipt_image_url}
                alt={`Payment receipt for ${receiptView.id}`}
                className="w-full h-auto border border-[#3f3b35]"
              />
            ) : (
              <p className="text-[#9e978e] text-sm py-8 text-center uppercase">
                No receipt image attached to this order.
              </p>
            )}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[#f2ede4]">
                Total: <strong>{receiptView.total.toFixed(2)} EGP</strong>
              </span>
              {receiptView.status === "Pending payment" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setReceiptView(null);
                      setStatus(receiptView, "Confirmed");
                    }}
                    className="px-4 py-2 bg-[#2ea043] hover:bg-[#279039] text-white font-heading uppercase text-xs tracking-wider border-2 border-black shadow-[3px_3px_0px_black] transition"
                  >
                    ✓ Confirm
                  </button>
                  <button
                    onClick={() => {
                      setReceiptView(null);
                      setStatus(receiptView, "Rejected");
                    }}
                    className="admin-btn-danger"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
