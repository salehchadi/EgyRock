/**
 * Data Access Layer for Orders
 * All database operations for orders go through this module
 */

import { getSheetData, appendSheetData, updateSheetData } from "./sheetsClient";
import type { Order, OrderItem } from "../types";

const SHEET_NAME = "Orders";

/**
 * Convert row array to Order object
 */
function rowToOrder(row: string[]): Order {
  return {
    id: row[0] || "",
    user_id: row[1] || "",
    customer_name: row[2] || "",
    customer_phone: row[3] || "",
    shipping_address: row[4] || "",
    items_json: row[5] || "[]",
    total: parseFloat(row[6]) || 0,
    status: (row[7] as Order["status"]) || "Pending payment",
    receipt_image_url: row[8] || "",
    created_at: row[9] || new Date().toISOString(),
    confirmed_at: row[10] || "",
  };
}

/**
 * Convert Order object to row array
 */
function orderToRow(order: Order): string[] {
  return [
    order.id,
    order.user_id,
    order.customer_name,
    order.customer_phone,
    order.shipping_address,
    order.items_json,
    order.total.toString(),
    order.status,
    order.receipt_image_url,
    order.created_at,
    order.confirmed_at,
  ];
}

/**
 * Get all orders
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const rows = await getSheetData(SHEET_NAME, "A2:K1000");
    return rows.map((row) => rowToOrder(row));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const orders = await getOrders();
    return orders.find((o) => o.id === id) || null;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return null;
  }
}

/**
 * Get orders by user ID
 */
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  try {
    const orders = await getOrders();
    return orders.filter((o) => o.user_id === userId);
  } catch (error) {
    console.error("Error fetching orders by user ID:", error);
    return [];
  }
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(status: Order["status"]): Promise<Order[]> {
  try {
    const orders = await getOrders();
    return orders.filter((o) => o.status === status);
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    return [];
  }
}

/**
 * Create a new order
 */
export async function createOrder(
  order: Omit<Order, "id" | "created_at" | "confirmed_at">,
): Promise<Order> {
  try {
    const id = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newOrder: Order = {
      ...order,
      id,
      created_at: new Date().toISOString(),
      confirmed_at: "",
    };

    await appendSheetData(SHEET_NAME, "A1", [orderToRow(newOrder)]);
    return newOrder;
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Failed to create order");
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  id: string,
  status: Order["status"],
): Promise<Order | null> {
  try {
    const orders = await getOrders();
    const index = orders.findIndex((o) => o.id === id);

    if (index === -1) {
      return null;
    }

    const updatedOrder = { ...orders[index], status };

    // Set confirmed_at timestamp when status becomes Confirmed
    if (status === "Confirmed" && !orders[index].confirmed_at) {
      updatedOrder.confirmed_at = new Date().toISOString();
    }

    const rowIndex = index + 2; // +2 for header and 1-based indexing
    await updateSheetData(SHEET_NAME, `A${rowIndex}:K${rowIndex}`, [orderToRow(updatedOrder)]);
    return updatedOrder;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Failed to update order status");
  }
}

/**
 * Update order details
 */
export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  try {
    const orders = await getOrders();
    const index = orders.findIndex((o) => o.id === id);

    if (index === -1) {
      return null;
    }

    const updatedOrder = { ...orders[index], ...updates };
    const rowIndex = index + 2; // +2 for header and 1-based indexing

    await updateSheetData(SHEET_NAME, `A${rowIndex}:K${rowIndex}`, [orderToRow(updatedOrder)]);
    return updatedOrder;
  } catch (error) {
    console.error("Error updating order:", error);
    throw new Error("Failed to update order");
  }
}
