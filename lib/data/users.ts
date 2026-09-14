/**
 * Data Access Layer for Users
 * All database operations for users go through this module
 */

import { getSheetData, appendSheetData, updateSheetData } from "./sheetsClient";
import type { User } from "../types";

const SHEET_NAME = "Users";

/**
 * Convert row array to User object
 */
function rowToUser(row: string[]): User {
  return {
    id: row[0] || "",
    email: row[1] || "",
    password_hash: row[2] || "",
    name: row[3] || "",
    role: (row[4] as User["role"]) || "customer",
    created_at: row[5] || new Date().toISOString(),
  };
}

/**
 * Convert User object to row array
 */
function userToRow(user: User): string[] {
  return [user.id, user.email, user.password_hash, user.name, user.role, user.created_at];
}

/**
 * Get all users
 */
export async function getUsers(): Promise<User[]> {
  try {
    const rows = await getSheetData(SHEET_NAME, "A2:F1000");
    return rows.map((row) => rowToUser(row));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const users = await getUsers();
    return users.find((u) => u.id === id) || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}

/**
 * Get user by email (case-insensitive)
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const users = await getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

/**
 * Create a new user
 */
export async function createUser(user: Omit<User, "id" | "created_at">): Promise<User> {
  try {
    // Check if email already exists
    const existingUser = await getUserByEmail(user.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const id = `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      ...user,
      id,
      created_at: new Date().toISOString(),
    };

    await appendSheetData(SHEET_NAME, "A1", [userToRow(newUser)]);
    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
}

/**
 * Update user details
 */
export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  try {
    const users = await getUsers();
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      return null;
    }

    // If updating email, check for duplicates
    if (updates.email && updates.email !== users[index].email) {
      const existingUser = await getUserByEmail(updates.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error("User with this email already exists");
      }
    }

    const updatedUser = { ...users[index], ...updates };
    const rowIndex = index + 2; // +2 for header and 1-based indexing

    await updateSheetData(SHEET_NAME, `A${rowIndex}:F${rowIndex}`, [userToRow(updatedUser)]);
    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
}
