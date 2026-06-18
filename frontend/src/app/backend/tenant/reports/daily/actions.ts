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

export async function getDailyReportData(selectedBranchId = "all") {
  try {
    const headers = await getHeaders();

    // 1. Ambil profile & tenant info dari Golang
    const profileRes = await fetch(`${GOLANG_BASE}/tenant-umkm`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!profileRes.ok) {
      return { status: "error", message: "Gagal memuat profil bisnis dari server Go" };
    }
    const profileData = await profileRes.json();
    const profile = profileData.profile;

    if (!profile) {
      return { status: "error", message: "Profil tidak ditemukan" };
    }

    // Tentukan tenantOwnerId & userBranchId
    const tenantOwnerId = profile.tenant_owner_id || profile.id;
    const userBranchId = profile.branch_id || null;

    // 2. Fetch Branches dari Golang
    const branchesRes = await fetch(`${GOLANG_BASE}/branches`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!branchesRes.ok) {
      return { status: "error", message: "Gagal memuat data cabang dari server Go" };
    }
    const branchesData = await branchesRes.json();
    const branches = branchesData.data || [];

    // Tentukan branch ID yang akan difilter
    const activeBranchId = userBranchId ? userBranchId : selectedBranchId;

    // 3. Ambil data penjualan (daily) dari Golang
    const query = new URLSearchParams({
      type: "daily",
      branch_id: activeBranchId,
    });
    const reportRes = await fetch(`${GOLANG_BASE}/reports/sales?${query.toString()}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!reportRes.ok) {
      return { status: "error", message: "Gagal memuat laporan penjualan harian dari server Go" };
    }
    const reportData = await reportRes.json();

    return {
      status: "success",
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        business_name: profile.business_name,
        email: profile.email,
        branch_id: userBranchId,
        tenant_owner_id: tenantOwnerId,
      },
      branches,
      selectedBranchId: activeBranchId,
      userBranchId: userBranchId,
      data: reportData.data || [],
      summary: reportData.summary || { total_income: 0, total_expense: 0, net_balance: 0 },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load report data";
    console.error("Server Action getDailyReportData Error:", error);
    return {
      status: "error",
      message: errorMessage,
    };
  }
}
