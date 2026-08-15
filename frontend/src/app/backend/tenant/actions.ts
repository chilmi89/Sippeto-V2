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

export async function getTenantDashboardData(branchId?: string) {
  try {
    const headers = await getHeaders();
    const query = branchId && branchId !== "all" ? `?branch_id=${branchId}` : "";

    const [tenantRes, branchesRes] = await Promise.all([
      fetch(`${GOLANG_BASE}/tenant-umkm${query}`, {
        method: "GET",
        headers,
        next: { revalidate: 0 },
      }),
      fetch(`${GOLANG_BASE}/branches`, {
        method: "GET",
        headers,
        next: { revalidate: 0 },
      }),
    ]);

    if (!tenantRes.ok) {
      return { status: "error", message: "Gagal memuat data profil UMKM dari server" };
    }

    const [tenantData, branchesData] = await Promise.all([
      tenantRes.json(),
      branchesRes.ok ? branchesRes.json() : Promise.resolve({ data: [] }),
    ]);

    const profile = tenantData.profile;
    const financials = tenantData.financials;
    const branches = branchesData.data || [];

    const userBranchId = profile?.branch_id || null;
    const initialBranchId = userBranchId || (branchId || "all");

    return {
      status: "success",
      profile,
      financials,
      branches: branches.map((b: any) => ({ id: b.id, name: b.name })),
      userBranchId,
      initialBranchId,
    };
  } catch (error: any) {
    console.error("getTenantDashboardData Error:", error);
    return { status: "error", message: "Gagal terhubung ke backend server." };
  }
}

export async function getTenantFinancialsAction(branchId?: string) {
  try {
    const headers = await getHeaders();
    const query = branchId && branchId !== "all" ? `?branch_id=${branchId}` : "";
    const res = await fetch(`${GOLANG_BASE}/tenant-umkm${query}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return { status: "error", message: "Gagal mengambil data statistik keuangan" };
    }

    const data = await res.json();
    return {
      status: "success",
      summary: data.financials?.summary,
      charts: data.financials?.charts,
    };
  } catch (error: any) {
    console.error("getTenantFinancialsAction Error:", error);
    return { status: "error", message: "Gagal terhubung ke backend server." };
  }
}
