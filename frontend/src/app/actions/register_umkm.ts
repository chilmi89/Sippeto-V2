"use server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8080/api";

interface UmkmPayload {
  id?: string;
  full_name: string;
  business_name: string;
  email: string;
  phone_number: string;
  address: string;
}

export async function createUmkmAction(payload: UmkmPayload) {
  try {
    const res = await fetch(`${BACKEND_API_URL}/public/tenant-umkm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal mendaftarkan UMKM." };
    return { success: true, message: data.message, profile: data.profile };
  } catch (err) {
    console.error("createUmkmAction Error:", err);
    return { error: "Gagal terhubung ke server backend." };
  }
}

export async function updateUmkmAction(payload: UmkmPayload) {
  try {
    const res = await fetch(`${BACKEND_API_URL}/public/tenant-umkm`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal memperbarui profil UMKM." };
    return { success: true, message: data.message, profile: data.profile };
  } catch (err) {
    console.error("updateUmkmAction Error:", err);
    return { error: "Gagal terhubung ke server backend." };
  }
}
