"use server";

import { cookies } from "next/headers";

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

export async function getNotificationsAction() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/tenant/notifications`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memuat notifikasi." };
    }

    return {
      status: "success",
      pendingOrdersCount: data.pendingOrdersCount,
      lowStockCount: data.lowStockCount,
      totalCount: data.totalCount,
      pendingOrders: data.pendingOrders,
      lowStockProducts: data.lowStockProducts,
    };
  } catch (err) {
    console.error("getNotificationsAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}
