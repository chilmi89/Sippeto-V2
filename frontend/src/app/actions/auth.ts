"use server";

import { cookies } from "next/headers";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

interface LoginPayload {
  email?: string;
  password?: string;
}

export async function loginAction(payload: LoginPayload) {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || "Terjadi kesalahan saat login." };
    }

    const cookieStore = await cookies();

    cookieStore.set("token", data.token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    if (data.refresh_token) {
      cookieStore.set("refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    cookieStore.set("role_name", data.user?.role_name || "", {
      httpOnly: false,
      secure: false,
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

export async function refreshTokenAction() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return { error: "Refresh token tidak ditemukan." };
    }

    const res = await fetch(`${BACKEND_API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      cookieStore.delete("token");
      cookieStore.delete("role_name");
      cookieStore.delete("refresh_token");
      return { error: "Sesi habis, silakan login ulang." };
    }

    const data = await res.json();

    cookieStore.set("token", data.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return { success: true };
  } catch (err) {
    console.error("Refresh Token Action Error:", err);
    return { error: "Gagal memperbarui token sesi." };
  }
}
