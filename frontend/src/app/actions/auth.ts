"use server";

import { cookies } from "next/headers";

interface LoginPayload {
  email?: string;
  password?: string;
}

export async function loginAction(payload: LoginPayload) {
  try {
    // Memanggil API login pada Go backend
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || "Terjadi kesalahan saat login." };
    }

    const cookieStore = await cookies();

    // Set cookie token secara HTTP-Only di server Next.js
    cookieStore.set("token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 hari
      path: "/",
    });

    // Set cookie role_name agar middleware & UI dapat membaca
    cookieStore.set("role_name", data.user?.role_name || "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return { success: true, user: data.user };
  } catch (err) {
    console.error("Login Action Error:", err);
    return { error: "Gagal terhubung ke server backend Go." };
  }
}
