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

// ─── Superadmin: Kelola Tenant ────────────────────────────────────────────────
export async function getTenantsAction(page: number, limit: number, search?: string) {
  try {
    const headers = await getHeaders();
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search: search || "",
    });

    const res = await fetch(`${GOLANG_BASE}/admin/tenant?${query.toString()}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memuat tenant." };
    }

    return { status: "success", data: data.data, total: data.total, totalPages: data.totalPages };
  } catch (err) {
    console.error("getTenantsAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function updateTenantAction(payload: { id: string; is_active?: boolean; metadata?: any }) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/admin/tenant`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal mengubah status tenant." };
    }

    revalidatePath("/backend/admin/tenants");
    return { status: "success", data };
  } catch (err) {
    console.error("updateTenantAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

// ─── Tenant: Kelola Profil Tenant UMKM Mandiri ───────────────────────────────
export async function getTenantUMKMAction(branchId?: string) {
  try {
    const headers = await getHeaders();
    const query = branchId ? `?branch_id=${branchId}` : "";
    const res = await fetch(`${GOLANG_BASE}/tenant-umkm${query}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memuat profil bisnis." };
    }

    return { status: "success", data };
  } catch (err) {
    console.error("getTenantUMKMAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function updateTenantUMKMAction(payload: {
  full_name?: string;
  business_name?: string;
  phone_number?: string;
  address?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
}) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/tenant-umkm`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal mengubah profil bisnis." };
    }

    revalidatePath("/backend/tenant");
    revalidatePath("/backend/tenant/profile");
    return { status: "success", data };
  } catch (err) {
    console.error("updateTenantUMKMAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}
