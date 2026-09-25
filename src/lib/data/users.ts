import { User, UserRole } from "@/types";
import { readTab, appendRow, updateRow } from "./sheetsClient";

const TAB = "Users";

function rowToUser(row: string[]): User {
  return {
    id: row[0] || "",
    email: (row[1] || "").toLowerCase().trim(),
    password_hash: row[2] || "",
    name: row[3] || "",
    role: (row[4] as UserRole) || "customer",
    created_at: row[5] || new Date().toISOString(),
    phone: row[6] || "",
    address: row[7] || "",
    gender: (row[8] as User["gender"]) || "",
    age: row[9] || "",
  };
}

function userToRow(u: User): any[] {
  return [
    u.id,
    u.email.toLowerCase().trim(),
    u.password_hash,
    u.name,
    u.role,
    u.created_at,
    u.phone || "",
    u.address || "",
    u.gender || "",
    u.age || "",
  ];
}

export async function getUsers(): Promise<User[]> {
  const rows = await readTab(TAB);
  if (rows.length <= 1) return [];

  return rows
    .slice(1)
    .map(rowToUser)
    .filter((u) => Boolean(u.id));
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalized = email.toLowerCase().trim();
  const users = await getUsers();
  return users.find((u) => u.email === normalized) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) || null;
}

/**
 * Input accepted by `createUser`.
 * Identity fields are required; profile fields (phone, address, gender, age) are
 * collected by the registration form and default to empty strings when omitted.
 */
export type CreateUserInput = Omit<
  User,
  "id" | "created_at" | "phone" | "address" | "gender" | "age"
> &
  Partial<Pick<User, "phone" | "address" | "gender" | "age">>;

export async function createUser(data: CreateUserInput): Promise<User> {
  if (!data.email || !data.password_hash) {
    throw new Error("Missing required user fields (email, password_hash)");
  }

  const existing = await getUserByEmail(data.email);
  if (existing) {
    throw new Error(`User with email "${data.email}" already exists`);
  }

  const userId = `USR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const newUser: User = {
    phone: "",
    address: "",
    gender: "",
    age: "",
    ...data,
    id: userId,
    email: data.email.toLowerCase().trim(),
    role: data.role || "customer",
    created_at: new Date().toISOString(),
  };

  await appendRow(TAB, userToRow(newUser));
  return newUser;
}

export async function updateUserRole(id: string, role: UserRole): Promise<User> {
  const rows = await readTab(TAB);
  const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`User ${id} not found`);
  }

  const current = rowToUser(rows[rowIndex]);
  const updated: User = { ...current, role };

  await updateRow(TAB, rowIndex + 1, userToRow(updated));
  return updated;
}
