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

// GET: Fetch discounts
export async function getDiscountsAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
  profile_id?: string;
}) {
  try {
    const headers = await getHeaders();
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.profile_id) query.append("profile_id", params.profile_id);

    const res = await fetch(`${GOLANG_BASE}/discounts?${query.toString()}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal mengambil data diskon." };
    return {
      success: true,
      data: data.data,
      total: data.total,
      page: data.page,
      totalPages: data.totalPages,
    };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// POST: Create Discount
export async function createDiscountAction(payload: {
  profile_id: string;
  code?: string | null;
  name: string;
  type: string; // PERCENTAGE / FIXED_AMOUNT
  value: number;
  min_purchase?: number;
  max_discount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/discounts`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal membuat diskon." };
    return { success: true, data: data.data, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// PATCH: Update Discount
export async function updateDiscountAction(
  id: string,
  payload: {
    code?: string | null;
    name?: string;
    type?: string;
    value?: number;
    min_purchase?: number;
    max_discount?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    is_active?: boolean;
  }
) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/discounts/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal memperbarui diskon." };
    return { success: true, data: data.data, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// DELETE: Delete Discount
export async function deleteDiscountAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/discounts/${id}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal menghapus diskon." };
    return { success: true, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// POST: Validate Discount Code (for POS / Checkout)
export async function validateDiscountCodeAction(payload: {
  code: string;
  profile_id: string;
  subtotal: number;
}) {
  try {
    const res = await fetch(`${GOLANG_BASE}/discounts/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Kode kupon diskon tidak valid." };
    return { success: true, data: data.data };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// GET: Fetch product IDs associated with a discount
export async function getDiscountProductsAction(discountId: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/discounts/${discountId}/products`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal mengambil produk diskon." };
    return { success: true, product_ids: data.product_ids || [] };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}

// POST: Toggle discount status for a specific product
export async function toggleDiscountProductAction(discountId: string, productId: string, enabled: boolean) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/discounts/${discountId}/products/toggle`, {
      method: "POST",
      headers,
      body: JSON.stringify({ product_id: productId, enabled }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Gagal memperbarui status diskon produk." };
    return { success: true, message: data.message };
  } catch {
    return { error: "Gagal terhubung ke server backend Go." };
  }
}
