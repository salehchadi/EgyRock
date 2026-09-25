import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/lib/data/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, address, gender, age } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (!phone || !address || !gender || !age) {
      return NextResponse.json(
        { error: "Phone, location address, gender, and age are required" },
        { status: 400 },
      );
    }

    if (!["male", "female", "other"].includes(gender)) {
      return NextResponse.json({ error: "Invalid gender value" }, { status: 400 });
    }

    const ageNum = parseInt(String(age), 10);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      return NextResponse.json(
        { error: "Age must be a number between 13 and 120" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      role: "customer",
      phone: String(phone).trim(),
      address: String(address).trim(),
      gender,
      age: String(ageNum),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        age: user.age,
      },
    });
  } catch (error: any) {
    console.error("[Register API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 },
    );
  }
}
