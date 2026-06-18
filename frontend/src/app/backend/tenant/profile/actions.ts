"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const GOLANG_BASE = process.env.BACKEND_API_URL || "http://localhost:8080/api";

async function getHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function updateProfileAction(payload: {
  id: string;
  full_name?: string;
  business_name?: string | null;
  phone_number?: string | null;
  address?: string | null;
  bio?: string | null;
  avatar_url?: string;
  banner_url?: string;
  username?: string | null;
  payment_qr?: string | null;
}) {
  try {
    const headers = await getHeaders();
    const {
      id,
      full_name,
      business_name,
      phone_number,
      address,
      bio,
      avatar_url,
      banner_url,
      username,
      payment_qr,
    } = payload;

    if (!id) {
      return { status: "error", message: "ID Profile tidak ditemukan" };
    }

    // Validasi format username di frontend sebelum dikirim
    let cleanUsername: string | null = null;
    if (username !== undefined && username !== null) {
      const trimmed = username.trim().toLowerCase();
      if (trimmed !== "") {
        if (!/^[a-z0-9-]+$/.test(trimmed)) {
          return {
            status: "error",
            message: "Username hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).",
          };
        }
        cleanUsername = trimmed;
      }
    }

    // Siapkan body request untuk API Golang
    const body = {
      full_name,
      business_name,
      phone_number,
      address,
      bio,
      avatar_url,
      banner_url,
      username: cleanUsername,
      payment_qr,
    };

    // Kirim request ke backend Golang
    const res = await fetch(`${GOLANG_BASE}/tenant-umkm`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memperbarui profil." };
    }

    revalidatePath("/backend/tenant/profile");
    return { status: "success", data };
  } catch (error) {
    console.error("updateProfileAction error:", error);
    return { status: "error", message: "Gagal memperbarui profil." };
  }
}
