import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/lib/data/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      address,
      gender,
      age,
      birthday,
      governorate,
      city,
      region,
      street,
      building,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    // Build composite address if structured parts are provided
    const compositeAddress =
      address || [street, building, region, city, governorate].filter(Boolean).join(", ") || "";

    if (!phone || !compositeAddress || !gender) {
      return NextResponse.json(
        { error: "Phone, location address, and gender are required" },
        { status: 400 },
      );
    }

    if (!birthday && !age) {
      return NextResponse.json({ error: "Birthday is required" }, { status: 400 });
    }

    if (!["male", "female", "other"].includes(gender)) {
      return NextResponse.json({ error: "Invalid gender value" }, { status: 400 });
    }

    let calculatedAge = 20;
    if (birthday) {
      const birthYear = new Date(birthday).getFullYear();
      if (!isNaN(birthYear)) {
        calculatedAge = new Date().getFullYear() - birthYear;
      }
    } else if (age) {
      calculatedAge = parseInt(String(age), 10);
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
      address: String(compositeAddress).trim(),
      gender,
      age: String(calculatedAge),
      birthday: birthday || "",
      governorate: governorate || "",
      city: city || "",
      region: region || "",
      street: street || "",
      building: building || "",
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
