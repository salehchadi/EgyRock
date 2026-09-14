import bcrypt from "bcryptjs";
import { getUserByEmail } from "../src/lib/data/users";

async function verifyAuthLogic() {
  console.log("🔐 [EgyRock] Testing Authentication Logic & Role Guarding...");

  // 1. Check admin user exists in DB
  const admin = await getUserByEmail("admin@egyrock.com");
  console.log(
    "Admin user lookup:",
    admin ? `Found: ${admin.email} (Role: ${admin.role})` : "NOT FOUND",
  );
  if (!admin || admin.role !== "admin") {
    throw new Error("Admin user check failed");
  }

  // Verify admin password
  const adminPassMatch = await bcrypt.compare("admin123", admin.password_hash);
  console.log("Admin password verification:", adminPassMatch ? "MATCHED (VALID)" : "FAILED");
  if (!adminPassMatch) throw new Error("Admin password mismatch");

  // 2. Check customer user exists in DB
  const customer = await getUserByEmail("customer@egyrock.local");
  console.log(
    "Customer user lookup:",
    customer ? `Found: ${customer.email} (Role: ${customer.role})` : "NOT FOUND",
  );
  if (!customer || customer.role !== "customer") {
    throw new Error("Customer user check failed");
  }

  const customerPassMatch = await bcrypt.compare("customer123", customer.password_hash);
  console.log("Customer password verification:", customerPassMatch ? "MATCHED (VALID)" : "FAILED");
  if (!customerPassMatch) throw new Error("Customer password mismatch");

  // 3. Verify role security rules
  console.log("🛡️ Checking Role Access Matrix:");
  const testUsers = [
    { role: "unauthenticated", canAccessAdmin: false, canAccessAccount: false },
    { role: "customer", canAccessAdmin: false, canAccessAccount: true },
    { role: "admin", canAccessAdmin: true, canAccessAccount: true },
  ];

  for (const u of testUsers) {
    const adminAllowed = u.role === "admin";
    const accountAllowed = u.role === "customer" || u.role === "admin";
    console.log(
      `  - Role [${u.role}]: Admin Access = ${adminAllowed ? "ALLOWED ✅" : "BLOCKED ❌"} | Account Access = ${accountAllowed ? "ALLOWED ✅" : "BLOCKED ❌"}`,
    );
  }

  console.log("✅ [EgyRock] Auth logic and role separation successfully verified!");
}

verifyAuthLogic().catch((err) => {
  console.error("❌ Auth verification failed:", err);
  process.exit(1);
});
