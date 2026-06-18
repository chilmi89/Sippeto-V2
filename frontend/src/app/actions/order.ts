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

export async function getOrdersAction() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/tenant/orders`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memuat pesanan." };
    }

    return { status: "success", data };
  } catch (err) {
    console.error("getOrdersAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function updateOrderStatusAction(payload: { id: string; status: string }) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/tenant/orders`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal mengubah status pesanan." };
    }

    revalidatePath("/backend/tenant/orders");
    revalidatePath("/backend/tenant/transactions");
    revalidatePath("/backend/tenant/stocks");
    return { status: "success", message: data.message };
  } catch (err) {
    console.error("updateOrderStatusAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}
