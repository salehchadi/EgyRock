// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetStore, seedRows, dataRows, buildFakeSheetsModule } from "../helpers/fakeSheets";

/**
 * PROJECT_SPEC.md §4 — Checkout Flow (Manual InstaPay)
 *
 * Exercises the money path end to end against the real Data Access Layer
 * modules, with the Google Sheets client swapped for the in-memory fake:
 *
 *   createOrder()                     -> "Pending payment", stock untouched
 *   updateOrderStatus(id, "Confirmed")-> stock decremented exactly once
 *   updateOrderStatus(id, "Rejected") -> stock untouched
 */
vi.mock("@/lib/data/sheetsClient", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/data/sheetsClient")>("@/lib/data/sheetsClient");
  return buildFakeSheetsModule(actual.TAB_HEADERS);
});

import { createOrder, getOrders, updateOrderStatus, getOrdersByUserId } from "@/lib/data/orders";
import { getProductById } from "@/lib/data/products";
import type { OrderItem } from "@/types";

function productRow(id: string, quantity: number, price = 250): unknown[] {
  return [
    id,
    "t-shirts",
    `${id} EN`,
    `${id} AR`,
    `${id} FR`,
    "desc en",
    "desc ar",
    "desc fr",
    price,
    quantity,
    JSON.stringify([`/images/placeholders/${id}.jpeg`]),
    "2026-01-01T00:00:00.000Z",
  ];
}

function item(product_id: string, quantity: number, unit_price = 250): OrderItem {
  return { product_id, name: `${product_id} EN`, quantity, unit_price };
}

function shipping() {
  return {
    user_id: "USR-1",
    customer_name: "Nour Hassan",
    customer_phone: "01001234567",
    shipping_address: "12 El-Moez St, Cairo",
    receipt_image_url: "https://blob.example.com/receipts/instapay-1.png",
  };
}

/** Quantity currently stored in the Products sheet for a product. */
async function stockOf(id: string): Promise<number> {
  const product = await getProductById(id);
  return product ? product.quantity : -1;
}

beforeEach(() => {
  resetStore();
  seedRows("Products", [productRow("riff-tee", 5), productRow("amp-mug", 10, 120)]);
  seedRows("Orders", []);
});

describe("createOrder — customer checkout submission", () => {
  it("creates the order with status 'Pending payment'", async () => {
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 2)],
      total: 500,
    });

    expect(order.id).toMatch(/^ORD-/);
    expect(order.status).toBe("Pending payment");
    expect(order.confirmed_at).toBeUndefined();
    expect(order.created_at).toBeTruthy();
    expect(order.items).toEqual([item("riff-tee", 2)]);
    expect(order.total).toBe(500);
    expect(order.receipt_image_url).toBe(shipping().receipt_image_url);
  });

  it("does NOT decrement stock at checkout (AGENTS.md rule 3)", async () => {
    expect(await stockOf("riff-tee")).toBe(5);

    await createOrder({ ...shipping(), items: [item("riff-tee", 2)], total: 500 });

    expect(await stockOf("riff-tee")).toBe(5);
  });

  it("appears in the customer's order history immediately", async () => {
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 1)],
      total: 250,
    });

    const history = await getOrdersByUserId("USR-1");
    expect(history.map((o) => o.id)).toContain(order.id);
  });

  it("is not visible to a different customer", async () => {
    await createOrder({ ...shipping(), items: [item("riff-tee", 1)], total: 250 });

    expect(await getOrdersByUserId("USR-999")).toEqual([]);
  });

  it("persists items_json so the admin panel can read line items back", async () => {
    await createOrder({
      ...shipping(),
      items: [item("riff-tee", 2), item("amp-mug", 1, 120)],
      total: 620,
    });

    const [stored] = await getOrders();
    expect(stored.items).toEqual([item("riff-tee", 2), item("amp-mug", 1, 120)]);
    expect(JSON.parse(dataRows("Orders")[0][5])).toHaveLength(2);
  });

  it("rejects an order with no items", async () => {
    await expect(createOrder({ ...shipping(), items: [], total: 0 })).rejects.toThrow(
      /at least one item/i,
    );
    expect(await getOrders()).toEqual([]);
  });

  it("rejects an order missing shipping details", async () => {
    await expect(
      createOrder({
        ...shipping(),
        customer_phone: "",
        items: [item("riff-tee", 1)],
        total: 250,
      }),
    ).rejects.toThrow(/required customer shipping information/i);
  });
});

describe("admin confirm — the only path that decrements stock", () => {
  it("decrements stock by the ordered quantity and stamps confirmed_at", async () => {
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 2)],
      total: 500,
    });

    const confirmed = await updateOrderStatus(order.id, "Confirmed");

    expect(confirmed.status).toBe("Confirmed");
    expect(confirmed.confirmed_at).toBeTruthy();
    expect(await stockOf("riff-tee")).toBe(3);
  });

  it("writes the new status straight through to the sheet", async () => {
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 1)],
      total: 250,
    });

    await updateOrderStatus(order.id, "Confirmed");

    const rows = dataRows("Orders");
    expect(rows).toHaveLength(1);
    expect(rows[0][0]).toBe(order.id);
    expect(rows[0][7]).toBe("Confirmed");
    expect(rows[0][10]).toBeTruthy();
    // Raw Products cell is a plain string, exactly like Google Sheets returns it.
    expect(dataRows("Products")[0][9]).toBe("4");
  });

  it("decrements every product in a multi-item order", async () => {
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 2), item("amp-mug", 4, 120)],
      total: 980,
    });

    await updateOrderStatus(order.id, "Confirmed");

    expect(await stockOf("riff-tee")).toBe(3);
    expect(await stockOf("amp-mug")).toBe(6);
  });

  it("does not decrement a second time if the admin clicks confirm twice", async () => {
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 2)],
      total: 500,
    });

    await updateOrderStatus(order.id, "Confirmed");
    const firstConfirmedAt = (await getOrders())[0].confirmed_at;

    await updateOrderStatus(order.id, "Confirmed");

    expect(await stockOf("riff-tee")).toBe(3);
    expect((await getOrders())[0].confirmed_at).toBe(firstConfirmedAt);
  });

  it("clamps stock at zero when the order exceeds remaining stock", async () => {
    // 5 in stock but the customer somehow ordered 9 (e.g. stock changed after
    // checkout). Confirming must never write a negative quantity.
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 9)],
      total: 2250,
    });

    await updateOrderStatus(order.id, "Confirmed");

    expect(await stockOf("riff-tee")).toBe(0);
  });

  it("throws for an unknown order id and leaves stock untouched", async () => {
    await expect(updateOrderStatus("ORD-DOES-NOT-EXIST", "Confirmed")).rejects.toThrow(
      /not found/i,
    );

    expect(await stockOf("riff-tee")).toBe(5);
  });
});

describe("admin reject — stock must stay untouched", () => {
  it("marks the order Rejected without decrementing stock", async () => {
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 2)],
      total: 500,
    });

    const rejected = await updateOrderStatus(order.id, "Rejected");

    expect(rejected.status).toBe("Rejected");
    expect(rejected.confirmed_at).toBeUndefined();
    expect(await stockOf("riff-tee")).toBe(5);
  });

  it("does not restore stock when a confirmed order is later rejected", async () => {
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 2)],
      total: 500,
    });

    await updateOrderStatus(order.id, "Confirmed");
    await updateOrderStatus(order.id, "Rejected");

    expect(await stockOf("riff-tee")).toBe(3);
  });

  it("does not decrement when moving from Rejected back to Pending payment", async () => {
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 2)],
      total: 500,
    });

    await updateOrderStatus(order.id, "Rejected");
    await updateOrderStatus(order.id, "Pending payment");

    expect(await stockOf("riff-tee")).toBe(5);
  });
});

describe("full customer → admin loop", () => {
  it("decrements only at the confirm step across the whole lifecycle", async () => {
    // 1. Customer checks out.
    const order = await createOrder({
      ...shipping(),
      items: [item("riff-tee", 3)],
      total: 750,
    });
    expect(order.status).toBe("Pending payment");
    expect(await stockOf("riff-tee")).toBe(5);

    // 2. Admin opens the queue and sees it pending.
    const pending = (await getOrders()).filter((o) => o.status === "Pending payment");
    expect(pending.map((o) => o.id)).toEqual([order.id]);

    // 3. Admin confirms the payment receipt.
    await updateOrderStatus(order.id, "Confirmed");

    // 4. Stock moved exactly once and the order left the pending queue.
    expect(await stockOf("riff-tee")).toBe(2);
    const remaining = await getOrders();
    expect(remaining[0].status).toBe("Confirmed");
    expect(remaining.filter((o) => o.status === "Pending payment")).toEqual([]);
  });
});
