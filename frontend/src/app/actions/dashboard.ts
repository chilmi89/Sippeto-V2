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

export async function getDashboardStatsAction() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/admin/dashboard/stats`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memuat statistik." };
    }

    return { status: "success", data };
  } catch (err) {
    console.error("getDashboardStatsAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server backend Go." };
  }
}
