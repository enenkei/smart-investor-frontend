"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return { error: "User already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if first user
  const [result] = await db.select({ value: count() }).from(users);
  const userCount = Number(result?.value ?? 0);
  const role = userCount === 0 ? "ADMIN" : "USER";
  const sessionId = crypto.randomBytes(16).toString("hex");

  try {
    await db.insert(users).values({
      email,
      password: hashedPassword,
      role,
      sessionId,
      isActive: false,
    });
  } catch (error) {
    console.error("Sign up error:", error);
    return { error: "Failed to create account" };
  }

  redirect("/login?registered=true");
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) return { error: "Email is required" };

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return { error: "Invalid email" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await db
    .update(users)
    .set({
      resetToken: token,
      resetTokenExp: expires,
    })
    .where(eq(users.email, email));

  // Simulate sending email
  console.log("-----------------------------------------");
  console.log(`RESET TOKEN FOR ${email}: ${token}`);
  console.log(`Reset link: http://localhost:3000/reset-password/${token}`);
  console.log("-----------------------------------------");

  return { success: true, message: "Reset link generated. Check server console logs." };
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token || !password) return { error: "Invalid request" };

  const user = await db.query.users.findFirst({
    where: eq(users.resetToken, token),
  });

  if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
    return { error: "Invalid or expired token" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db
    .update(users)
    .set({
      password: hashedPassword,
      resetToken: null,
      resetTokenExp: null,
    })
    .where(eq(users.id, user.id));

  redirect("/login?reset=true");
}
