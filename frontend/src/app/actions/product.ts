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

// ═══════════════════════════════════════════════════════════════
// KATEGORI PRODUK
// ═══════════════════════════════════════════════════════════════

// GET: Ambil daftar kategori (dengan pagination & filter scope)
export async function getCategoriesAction(params?: {
  page?: number;
  limit?: number;
  scope?: "all" | "global" | "tenant";
  search?: string;
  profile_id?: string;
}) {
  try {
    const headers = await getHeaders();
    const searchParams = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 10),
      scope: params?.scope ?? "all",
      ...(params?.search && { search: params.search }),
    });
    if (params?.profile_id) searchParams.set("profile_id", params.profile_id);

    const res = await fetch(`${GOLANG_BASE}/product-categories?${searchParams}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal mengambil data kategori." };
    return { success: true, data: data.data, total: data.total, page: data.page, totalPages: data.totalPages };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// POST: Buat kategori baru
export async function createCategoryAction(payload: { name: string; profile_id?: string | null }) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/product-categories`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal menambahkan kategori." };
    return { success: true, data: data.data, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// PATCH: Perbarui kategori
export async function updateCategoryAction(id: string, name: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/product-categories`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, name }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal memperbarui kategori." };
    return { success: true, data: data.data, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// DELETE: Hapus kategori
export async function deleteCategoryAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/product-categories?id=${id}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal menghapus kategori." };
    return { success: true, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// ═══════════════════════════════════════════════════════════════
// PRODUK
// ═══════════════════════════════════════════════════════════════

// GET: Ambil semua produk (global / by tenant / by branch / by id)
export async function getProductsAction(params?: {
  id?: string;
  tenant_id?: string;
  branch_id?: string;
}) {
  try {
    const headers = await getHeaders();
    const searchParams = new URLSearchParams();
    if (params?.id) searchParams.set("id", params.id);
    if (params?.tenant_id) searchParams.set("tenant_id", params.tenant_id);
    if (params?.branch_id) searchParams.set("branch_id", params.branch_id);

    const res = await fetch(`${GOLANG_BASE}/products?${searchParams}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal mengambil data produk." };
    return { success: true, data: data.data };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// POST: Buat produk baru + inisialisasi stok 0 di semua cabang
export async function createProductAction(payload: {
  profile_id: string;
  branch_id?: string | null;
  category_id?: string | null;
  name: string;
  description?: string | null;
  base_price?: number;
  sell_price?: number;
  image_url?: string | null;
  is_active?: boolean;
  branch_stocks?: Array<{
    branch_id: string;
    stock: number;
    min_stock: number;
  }>;
}) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/products`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal membuat produk baru." };
    return { success: true, data: data.data, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// PATCH: Perbarui data produk
export async function updateProductAction(payload: {
  id: string;
  category_id?: string | null;
  name?: string;
  description?: string | null;
  base_price?: number;
  sell_price?: number;
  image_url?: string | null;
  is_active?: boolean;
  branch_stocks?: Array<{
    branch_id: string;
    stock: number;
    min_stock: number;
  }>;
}) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/products`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal memperbarui produk." };
    return { success: true, data: data.data, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// DELETE: Hapus produk
export async function deleteProductAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/products?id=${id}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal menghapus produk." };
    return { success: true, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}
