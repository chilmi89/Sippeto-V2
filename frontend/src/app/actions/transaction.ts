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

// ─── TRANSACTION GROUPS ──────────────────────────────────────────────────────
export async function getTransactionGroupsAction(params: {
  id?: string;
  profile_id?: string;
  branch_id?: string;
  search?: string;
  date_start?: string;
  date_end?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const headers = await getHeaders();
    const query = new URLSearchParams();
    if (params.id) query.append("id", params.id);
    if (params.profile_id) query.append("profile_id", params.profile_id);
    if (params.branch_id) query.append("branch_id", params.branch_id);
    if (params.search) query.append("search", params.search);
    if (params.date_start) query.append("date_start", params.date_start);
    if (params.date_end) query.append("date_end", params.date_end);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const res = await fetch(`${GOLANG_BASE}/transaction/group?${query.toString()}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memuat transaksi." };
    }

    return { status: "success", data: data.data, total: data.total, page: data.page, totalPages: data.totalPages };
  } catch (err) {
    console.error("getTransactionGroupsAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function createTransactionGroupAction(body: any) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/transaction/group`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal membuat transaksi." };
    }

    revalidatePath("/backend/tenant/transactions");
    return { status: "success", data };
  } catch (err) {
    console.error("createTransactionGroupAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function updateTransactionGroupAction(body: any) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/transaction/group`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memperbarui transaksi." };
    }

    revalidatePath("/backend/tenant/transactions");
    return { status: "success", data };
  } catch (err) {
    console.error("updateTransactionGroupAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function deleteTransactionGroupAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/transaction/group?id=${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal menghapus transaksi." };
    }

    revalidatePath("/backend/tenant/transactions");
    return { status: "success", message: data.message };
  } catch (err) {
    console.error("deleteTransactionGroupAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

// ─── TRANSACTION CATEGORIES ──────────────────────────────────────────────────
export async function getCategoriesAction(params: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  profile_id?: string;
}) {
  try {
    const headers = await getHeaders();
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.type) query.append("type", params.type);
    if (params.search) query.append("search", params.search);
    if (params.profile_id) query.append("profile_id", params.profile_id);

    const res = await fetch(`${GOLANG_BASE}/kategori?${query.toString()}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memuat kategori." };
    }

    return { status: "success", data: data.data, total: data.total, totalPages: data.totalPages };
  } catch (err) {
    console.error("getCategoriesAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function createCategoryAction(body: { profile_id?: string; name: string; type: string }) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/kategori`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal menyimpan kategori." };
    }

    revalidatePath("/backend/admin/transactions/kategori-transaksi");
    return { status: "success", data };
  } catch (err) {
    console.error("createCategoryAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function updateCategoryAction(body: { id: string; name?: string; type?: string }) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/kategori`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memperbarui kategori." };
    }

    revalidatePath("/backend/admin/transactions/kategori-transaksi");
    return { status: "success", data };
  } catch (err) {
    console.error("updateCategoryAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/kategori?id=${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal menghapus kategori." };
    }

    revalidatePath("/backend/admin/transactions/kategori-transaksi");
    return { status: "success", message: data.message };
  } catch (err) {
    console.error("deleteCategoryAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

// ─── PAYMENT METHODS ──────────────────────────────────────────────────────────
export async function getPaymentMethodsAction(params: {
  page?: number;
  limit?: number;
  search?: string;
  profile_id?: string;
}) {
  try {
    const headers = await getHeaders();
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.search) query.append("search", params.search);
    if (params.profile_id) query.append("profile_id", params.profile_id);

    const res = await fetch(`${GOLANG_BASE}/payment_kategori?${query.toString()}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memuat metode pembayaran." };
    }

    return { status: "success", data: data.data, total: data.total, totalPages: data.totalPages };
  } catch (err) {
    console.error("getPaymentMethodsAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function createPaymentMethodAction(body: { profile_id?: string; name: string }) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/payment_kategori`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal menyimpan metode pembayaran." };
    }

    revalidatePath("/backend/admin/transactions/metode-pembayaran");
    return { status: "success", data };
  } catch (err) {
    console.error("createPaymentMethodAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function updatePaymentMethodAction(body: { id: string; name?: string; is_active?: boolean }) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/payment_kategori`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memperbarui metode pembayaran." };
    }

    revalidatePath("/backend/admin/transactions/metode-pembayaran");
    return { status: "success", data };
  } catch (err) {
    console.error("updatePaymentMethodAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}

export async function deletePaymentMethodAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/payment_kategori?id=${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal menghapus metode pembayaran." };
    }

    revalidatePath("/backend/admin/transactions/metode-pembayaran");
    return { status: "success", message: data.message };
  } catch (err) {
    console.error("deletePaymentMethodAction Error:", err);
    return { status: "error", message: "Gagal terhubung ke server Go." };
  }
}
