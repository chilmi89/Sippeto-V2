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

// ─── GET: Ambil data stok & mutasi halaman ──────────────────────────────────
export async function getStocksPageDataAction() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/stocks`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 403) {
        return { status: "forbidden", message: data.error || "Akses Ditolak" };
      }
      return { status: "error", message: data.error || "Gagal memuat data stok." };
    }

    return {
      status: "success",
      profile: data.profile,
      stocks: data.stocks,
      mutations: data.mutations,
      branches: data.branches,
      products: data.products,
    };
  } catch (err) {
    console.error("getStocksPageDataAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server backend Go." };
  }
}

// ─── PATCH: Adjust Stock (Opname) ──────────────────────────────────────────
export async function adjustStockAction(payload: {
  product_id: string;
  branch_id: string;
  stock: number;
  min_stock: number;
  notes?: string;
}) {
  try {
    const headers = await getHeaders();
    const body = {
      product_id: payload.product_id,
      branch_id: payload.branch_id,
      stock: payload.stock,
      min_stock: payload.min_stock,
      notes: payload.notes,
    };

    const res = await fetch(`${GOLANG_BASE}/stocks`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal menyesuaikan stok." };
    }

    revalidatePath("/backend/tenant/stocks");
    revalidatePath("/backend/tenant/products");
    return { status: "success", data: data.data };
  } catch (err) {
    console.error("adjustStockAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server backend Go." };
  }
}

// ─── PATCH: Transfer Stock ─────────────────────────────────────────────────
export async function transferStockAction(payload: {
  product_id: string;
  from_branch_id: string;
  to_branch_id: string;
  quantity: number;
  notes?: string;
}) {
  try {
    const headers = await getHeaders();
    const body = {
      product_id: payload.product_id,
      from_branch_id: payload.from_branch_id,
      to_branch_id: payload.to_branch_id,
      quantity: payload.quantity,
      is_transfer: true,
      notes: payload.notes,
    };

    const res = await fetch(`${GOLANG_BASE}/stocks`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal melakukan transfer stok." };
    }

    revalidatePath("/backend/tenant/stocks");
    revalidatePath("/backend/tenant/products");
    return { status: "success", data: data.data };
  } catch (err) {
    console.error("transferStockAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server backend Go." };
  }
}
