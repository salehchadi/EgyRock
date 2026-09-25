import { Coupon, CouponType } from "@/types";
import { readTab, appendRow, updateRow, deleteRow } from "./sheetsClient";

const TAB = "Coupons";

function rowToCoupon(row: string[]): Coupon {
  return {
    id: row[0] || "",
    code: (row[1] || "").trim(),
    type: (row[2] as CouponType) === "fixed" ? "fixed" : "percent",
    value: Number(row[3]) || 0,
    min_order: Math.max(0, Number(row[4]) || 0),
    active: String(row[5]).toLowerCase() !== "false",
    usage_limit: Math.max(0, parseInt(row[6], 10) || 0),
    used_count: Math.max(0, parseInt(row[7], 10) || 0),
    expires_at: row[8] || "",
    created_at: row[9] || new Date().toISOString(),
  };
}

function couponToRow(c: Coupon): any[] {
  return [
    c.id,
    c.code,
    c.type,
    c.value,
    c.min_order,
    c.active ? "true" : "false",
    c.usage_limit,
    c.used_count,
    c.expires_at || "",
    c.created_at,
  ];
}

export async function getCoupons(): Promise<Coupon[]> {
  const rows = await readTab(TAB);
  if (rows.length <= 1) return [];

  return rows
    .slice(1)
    .map(rowToCoupon)
    .filter((c) => Boolean(c.id));
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const coupons = await getCoupons();
  return coupons.find((c) => c.id === id) || null;
}

/** Case-insensitive lookup by the customer-facing coupon code. */
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const coupons = await getCoupons();
  return coupons.find((c) => c.code.toUpperCase() === normalized) || null;
}

export type CouponInput = Omit<Coupon, "id" | "used_count" | "created_at">;

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const code = (input.code || "").trim().toUpperCase();
  if (!code) {
    throw new Error("Coupon code is required");
  }
  if (input.type !== "percent" && input.type !== "fixed") {
    throw new Error('Coupon type must be "percent" or "fixed"');
  }
  if (!(Number(input.value) > 0)) {
    throw new Error("Coupon value must be greater than zero");
  }
  if (input.type === "percent" && Number(input.value) > 100) {
    throw new Error("Percent coupon cannot exceed 100");
  }

  const existing = await getCouponByCode(code);
  if (existing) {
    throw new Error(`Coupon code "${code}" already exists`);
  }

  const coupon: Coupon = {
    id: `CPN-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    code,
    type: input.type,
    value: Number(input.value),
    min_order: Math.max(0, Number(input.min_order) || 0),
    active: input.active !== false,
    usage_limit: Math.max(0, parseInt(String(input.usage_limit), 10) || 0),
    used_count: 0,
    expires_at: input.expires_at || "",
    created_at: new Date().toISOString(),
  };

  await appendRow(TAB, couponToRow(coupon));
  return coupon;
}

export async function updateCoupon(id: string, updates: Partial<CouponInput>): Promise<Coupon> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Coupon with ID "${id}" not found`);
  }

  const current = rowToCoupon(rows[rowIndex]);
  const merged: Coupon = {
    ...current,
    ...updates,
    id: current.id,
    used_count: current.used_count,
    created_at: current.created_at,
    code:
      updates.code !== undefined && updates.code.trim()
        ? updates.code.trim().toUpperCase()
        : current.code,
    value: updates.value !== undefined ? Number(updates.value) : current.value,
    min_order:
      updates.min_order !== undefined
        ? Math.max(0, Number(updates.min_order) || 0)
        : current.min_order,
    usage_limit:
      updates.usage_limit !== undefined
        ? Math.max(0, parseInt(String(updates.usage_limit), 10) || 0)
        : current.usage_limit,
  };

  if (!(merged.value > 0)) {
    throw new Error("Coupon value must be greater than zero");
  }

  await updateRow(TAB, rowIndex + 1, couponToRow(merged));
  return merged;
}

export async function deleteCoupon(id: string): Promise<void> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Coupon with ID "${id}" not found`);
  }

  await deleteRow(TAB, rowIndex + 1);
}

export interface CouponValidation {
  valid: boolean;
  error?: string;
  discount?: number;
  coupon?: Coupon;
}

/**
 * Server-side coupon validation against the order subtotal.
 * Never trusts the client: recomputes the discount from the stored coupon.
 */
export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  const coupon = await getCouponByCode(code || "");
  if (!coupon) {
    return { valid: false, error: "Invalid coupon code" };
  }
  if (!coupon.active) {
    return { valid: false, error: "This coupon is no longer active" };
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { valid: false, error: "This coupon has expired" };
  }
  if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, error: "This coupon has reached its usage limit" };
  }
  if (subtotal < coupon.min_order) {
    return {
      valid: false,
      error: `Minimum order amount for this coupon is EGP ${coupon.min_order}`,
    };
  }

  const discount =
    coupon.type === "percent"
      ? Math.round(((subtotal * coupon.value) / 100) * 100) / 100
      : Math.min(coupon.value, subtotal);

  return { valid: true, discount: Math.max(0, discount), coupon };
}

/** Increments the usage counter after a successful checkout with the coupon. */
export async function incrementCouponUsage(id: string): Promise<void> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) return;

  const coupon = rowToCoupon(rows[rowIndex]);
  const updated: Coupon = { ...coupon, used_count: coupon.used_count + 1 };
  await updateRow(TAB, rowIndex + 1, couponToRow(updated));
}
