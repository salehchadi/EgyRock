import { Order, OrderStatus } from "@/types";
import { readTab, appendRow, updateRow } from "./sheetsClient";
import { decrementProductStock } from "./products";

const TAB = "Orders";

function rowToOrder(row: string[]): Order {
  let items = [];
  try {
    items = JSON.parse(row[5] || "[]");
  } catch {
    items = [];
  }

  return {
    id: row[0] || "",
    user_id: row[1] || "",
    customer_name: row[2] || "",
    customer_phone: row[3] || "",
    shipping_address: row[4] || "",
    items,
    total: Number(row[6]) || 0,
    status: (row[7] as OrderStatus) || "Pending payment",
    receipt_image_url: row[8] || "",
    created_at: row[9] || new Date().toISOString(),
    confirmed_at: row[10] || undefined,
  };
}

function orderToRow(o: Order): any[] {
  return [
    o.id,
    o.user_id,
    o.customer_name,
    o.customer_phone,
    o.shipping_address,
    JSON.stringify(o.items),
    o.total,
    o.status,
    o.receipt_image_url,
    o.created_at,
    o.confirmed_at || "",
  ];
}

export async function getOrders(): Promise<Order[]> {
  const rows = await readTab(TAB);
  if (rows.length <= 1) return [];

  return rows
    .slice(1)
    .map(rowToOrder)
    .filter((o) => Boolean(o.id));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find((o) => o.id === id) || null;
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const orders = await getOrders();
  return orders.filter((o) => o.user_id === userId);
}

export async function createOrder(
  data: Omit<Order, "id" | "status" | "created_at" | "confirmed_at">,
): Promise<Order> {
  if (!data.customer_name || !data.customer_phone || !data.shipping_address) {
    throw new Error("Missing required customer shipping information");
  }

  if (!data.items || data.items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const newOrder: Order = {
    ...data,
    id: orderId,
    status: "Pending payment",
    created_at: new Date().toISOString(),
  };

  await appendRow(TAB, orderToRow(newOrder));
  return newOrder;
}

/**
 * Updates order status.
 * CRITICAL RULE: Decrements stock ONLY when moving from "Pending payment" to "Confirmed".
 */
export async function updateOrderStatus(id: string, newStatus: OrderStatus): Promise<Order> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Order ${id} not found`);
  }

  const current = rowToOrder(rows[rowIndex]);

  if (current.status === newStatus) {
    return current;
  }

  const isConfirming = current.status === "Pending payment" && newStatus === "Confirmed";

  const updated: Order = {
    ...current,
    status: newStatus,
    confirmed_at: isConfirming ? new Date().toISOString() : current.confirmed_at,
  };

  // If confirming payment, atomically decrement stock
  if (isConfirming) {
    for (const item of current.items) {
      try {
        await decrementProductStock(item.product_id, item.quantity);
      } catch (err) {
        console.error(`Failed to decrement stock for item ${item.product_id} in order ${id}:`, err);
      }
    }
  }

  await updateRow(TAB, rowIndex + 1, orderToRow(updated));
  return updated;
}
