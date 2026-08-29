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

export async function getTenantBanksAction(profileId?: string) {
  try {
    const headers = await getHeaders();
    const query = profileId ? `?profile_id=${profileId}` : "";
    const res = await fetch(`${GOLANG_BASE}/tenant-banks${query}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return { success: false, error: "Gagal mengambil data rekening bank", data: [] };
    }

    const json = await res.json();
    return { success: true, data: json.data || [] };
  } catch (err: any) {
    console.error("getTenantBanksAction error:", err);
    return { success: false, error: err.message || "Gagal mengambil data rekening bank", data: [] };
  }
}

export async function createTenantBankAction(payload: {
  profile_id?: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_primary?: boolean;
}) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/tenant-banks`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || "Gagal menambahkan rekening bank" };
    }

    revalidatePath("/backend/tenant/profile");
    revalidatePath("/backend/tenant/bank");
    return { success: true, data: json.data, message: json.message };
  } catch (err: any) {
    console.error("createTenantBankAction error:", err);
    return { success: false, error: err.message || "Gagal menambahkan rekening bank" };
  }
}

export async function updateTenantBankAction(
  id: string,
  payload: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    is_active?: boolean;
    is_primary?: boolean;
  }
) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/tenant-banks/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || "Gagal memperbarui rekening bank" };
    }

    revalidatePath("/backend/tenant/profile");
    revalidatePath("/backend/tenant/bank");
    return { success: true, data: json.data, message: json.message };
  } catch (err: any) {
    console.error("updateTenantBankAction error:", err);
    return { success: false, error: err.message || "Gagal memperbarui rekening bank" };
  }
}

export async function deleteTenantBankAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/tenant-banks/${id}`, {
      method: "DELETE",
      headers,
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || "Gagal menghapus rekening bank" };
    }

    revalidatePath("/backend/tenant/profile");
    revalidatePath("/backend/tenant/bank");
    return { success: true, message: json.message };
  } catch (err: any) {
    console.error("deleteTenantBankAction error:", err);
    return { success: false, error: err.message || "Gagal menghapus rekening bank" };
  }
}

export async function setPrimaryTenantBankAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/tenant-banks/${id}/primary`, {
      method: "PATCH",
      headers,
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || "Gagal mengatur rekening utama" };
    }

    revalidatePath("/backend/tenant/profile");
    revalidatePath("/backend/tenant/bank");
    return { success: true, message: json.message };
  } catch (err: any) {
    console.error("setPrimaryTenantBankAction error:", err);
    return { success: false, error: err.message || "Gagal mengatur rekening utama" };
  }
}
