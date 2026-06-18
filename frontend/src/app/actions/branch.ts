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

// ─── GET: Ambil semua cabang berdasarkan tenant_id ──────────────────────────
export async function getBranchesAction(tenantID: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/branches?tenant_id=${tenantID}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal mengambil data cabang." };
    return { success: true, data: data.data };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// ─── GET: Ambil detail satu cabang by ID ────────────────────────────────────
export async function getBranchByIDAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/branches?id=${id}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal mengambil data cabang." };
    return { success: true, data: data.data };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// ─── POST: Buat cabang baru (atomik + manager opsional) ─────────────────────
export async function createBranchAction(payload: {
  tenant_id: string;
  name: string;
  address?: string | null;
  phone_number?: string | null;
  manager_name?: string | null;
  manager_email?: string | null;
  manager_password?: string | null;
  payment_qr?: string | null;
}) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/branches`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal membuat cabang baru." };
    return { success: true, data: data.data, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// ─── PATCH: Perbarui data cabang ────────────────────────────────────────────
export async function updateBranchAction(
  id: string,
  payload: {
    name?: string;
    address?: string | null;
    phone_number?: string | null;
    is_active?: boolean;
    payment_qr?: string | null;
  }
) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/branches?id=${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal memperbarui cabang." };
    return { success: true, data: data.data, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// ─── DELETE: Hapus cabang ────────────────────────────────────────────────────
export async function deleteBranchAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/branches?id=${id}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal menghapus cabang." };
    return { success: true, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}
