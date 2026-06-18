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

export async function getSalesReportAction(params: {
  branch_id?: string;
  type?: string;
  date_start?: string;
  date_end?: string;
}) {
  try {
    const headers = await getHeaders();
    const query = new URLSearchParams();
    if (params.branch_id) query.append("branch_id", params.branch_id);
    if (params.type) query.append("type", params.type);
    if (params.date_start) query.append("date_start", params.date_start);
    if (params.date_end) query.append("date_end", params.date_end);

    const res = await fetch(`${GOLANG_BASE}/reports/sales?${query.toString()}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memuat laporan penjualan." };
    }

    return { status: "success", data: data.data, summary: data.summary, type: data.type };
  } catch (err) {
    console.error("getSalesReportAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}
