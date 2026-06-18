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

// Helper: map type income/expense
const mapType = (t: string) => {
  const low = t.toLowerCase();
  if (low === "pemasukan" || low === "income") return "INCOME";
  if (low === "pengeluaran" || low === "expense") return "EXPENSE";
  return t.toUpperCase();
};

// 1. Fetch POS Page Data (Init)
export async function getPOSPageData(editId?: string | null) {
  try {
    const headers = await getHeaders();

    // Batch 1: Semua fetch independen dilakukan paralel
    const [tenantRes, meRes, branchesRes, prodCatRes] = await Promise.all([
      fetch(`${GOLANG_BASE}/tenant-umkm`, { method: "GET", headers, next: { revalidate: 0 } }),
      fetch(`${GOLANG_BASE}/auth/me`, { method: "GET", headers, next: { revalidate: 0 } }),
      fetch(`${GOLANG_BASE}/branches`, { method: "GET", headers, next: { revalidate: 0 } }),
      fetch(`${GOLANG_BASE}/product-categories`, { method: "GET", headers, next: { revalidate: 0 } }),
    ]);

    if (!tenantRes.ok) {
      return { status: "error", message: "Gagal memuat profil UMKM dari server Go" };
    }

    const [tenantData, meData, branchesData, prodCatData] = await Promise.all([
      tenantRes.json(),
      meRes.ok ? meRes.json() : Promise.resolve({}),
      branchesRes.ok ? branchesRes.json() : Promise.resolve({ data: [] }),
      prodCatRes.ok ? prodCatRes.json() : Promise.resolve({ data: [] }),
    ]);

    const profile = tenantData.profile;
    if (!profile) {
      return { status: "error", message: "Profil tidak ditemukan" };
    }

    const tenantOwnerId = profile.tenant_owner_id || profile.id;
    const userRole = meData.role_name || "";
    const branches = branchesData.data || [];
    const categories = prodCatData.data || [];

    // Tentukan selected branch
    let selectedBranchId = "";
    if (profile.branch_id) {
      selectedBranchId = profile.branch_id;
    } else if (branches.length > 0) {
      selectedBranchId = branches[0].id;
    }

    // Batch 2: Fetch yang dependen pada tenantOwnerId & selectedBranchId
    const [pmRes, catRes, prodRes] = await Promise.all([
      fetch(`${GOLANG_BASE}/payment_kategori?profile_id=${tenantOwnerId}&limit=100`, { method: "GET", headers, next: { revalidate: 0 } }),
      fetch(`${GOLANG_BASE}/kategori?profile_id=${tenantOwnerId}&limit=100`, { method: "GET", headers, next: { revalidate: 0 } }),
      selectedBranchId
        ? fetch(`${GOLANG_BASE}/products?branch_id=${selectedBranchId}`, { method: "GET", headers, next: { revalidate: 0 } })
        : Promise.resolve(null),
    ]);

    const [pmData, catData, prodDataJson] = await Promise.all([
      pmRes.ok ? pmRes.json() : Promise.resolve({ data: [] }),
      catRes.ok ? catRes.json() : Promise.resolve({ data: [] }),
      prodRes?.ok ? prodRes.json() : Promise.resolve({ data: [] }),
    ]);

    const paymentMethods = pmData.data || [];
    const txCategories = catData.data || [];

    let initialProducts: any[] = [];
    if (selectedBranchId && prodDataJson) {
      initialProducts = (prodDataJson.data || []).map((prod: any) => ({
        id: prod.id,
        name: prod.name,
        sell_price: Number(prod.sell_price),
        base_price: Number(prod.base_price),
        image_url: prod.image_url,
        category_id: prod.category_id,
        product_categories: prod.product_categories
          ? { name: prod.product_categories.name }
          : null,
        current_branch_stock: prod.current_branch_stock ?? 0,
        current_branch_min_stock: prod.current_branch_min_stock ?? 0,
      }));
    }

    // Ambil edit transaction jika ada
    let editTransaction = null;
    if (editId) {
      const txRes = await fetch(`${GOLANG_BASE}/transaction/group?id=${editId}`, {
        method: "GET",
        headers,
        next: { revalidate: 0 }
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        const tx = txData.data?.[0];
        if (tx) {
          editTransaction = {
            id: tx.id,
            reference_number: tx.reference_number,
            transaction_date: tx.transaction_date,
            description: tx.description,
            customer_name: tx.customer_name,
            customer_phone: tx.customer_phone,
            customer_address: tx.customer_address,
            order_status: tx.order_status,
            branch_id: tx.branch_id,
            items: (tx.transaction_items || []).map((it: any) => ({
              id: it.id,
              name: it.name,
              amount: Number(it.amount),
              category_id: it.category_id,
              payment_method_id: it.payment_method_id,
              product_id: it.product_id,
              quantity: it.quantity ? Number(it.quantity) : 1,
            })),
          };
        }
      }
    }

    return {
      status: "success",
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        business_name: profile.business_name,
        email: profile.email,
        phone_number: profile.phone_number,
        address: profile.address,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        branch_id: profile.branch_id,
        userBranchId: profile.branch_id,
        userRole,
        tenant_owner_id: tenantOwnerId,
      },
      branches: branches.map((b: any) => ({ id: b.id, name: b.name })),
      categories: categories.map((c: any) => ({ id: c.id, name: c.name })),
      paymentMethods: paymentMethods.map((pm: any) => ({
        id: pm.id,
        name: pm.name,
      })),
      txCategories: txCategories.map((tc: any) => ({
        id: tc.id,
        name: tc.name,
        type: tc.type === "INCOME" ? "pemasukan" : "pengeluaran",
      })),
      initialProducts,
      initialBranchId: selectedBranchId,
      editTransaction,
    };
  } catch (error: any) {
    console.error("getPOSPageData error:", error);
    return {
      status: "error",
      message: `Gagal memuat konfigurasi kasir: ${error.message || error}`,
    };
  }
}

// 2. Fetch Products for a branch
export async function getPOSProductsAction(
  tenantOwnerId: string,
  branchId: string,
) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/products?branch_id=${branchId}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!res.ok) {
      return { status: "error", message: "Gagal memuat produk cabang" };
    }
    const prodData = await res.json();
    const data = (prodData.data || []).map((prod: any) => ({
      id: prod.id,
      name: prod.name,
      sell_price: Number(prod.sell_price),
      base_price: Number(prod.base_price),
      image_url: prod.image_url,
      category_id: prod.category_id,
      product_categories: prod.product_categories
        ? { name: prod.product_categories.name }
        : null,
      current_branch_stock: prod.current_branch_stock ?? 0,
      current_branch_min_stock: prod.current_branch_min_stock ?? 0,
    }));

    return { status: "success", data };
  } catch (error) {
    console.error("getPOSProductsAction error:", error);
    return { status: "error", message: "Gagal memuat produk cabang" };
  }
}

// 3. Save / Update POS Transaction Action
export async function savePOSTransactionAction(payload: {
  id?: string;
  profile_id: string;
  branch_id: string;
  reference_number: string;
  transaction_date: string;
  description: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  order_status: number;
  items: Array<{
    name: string;
    amount: number;
    category_id: string | null;
    payment_method_id: string;
    type: string;
    product_id: string;
    quantity: number;
  }>;
}) {
  try {
    const headers = await getHeaders();
    const {
      id,
      profile_id,
      branch_id,
      reference_number,
      transaction_date,
      description,
      customer_name,
      customer_phone,
      customer_address,
      order_status,
      items,
    } = payload;

    if (!profile_id) {
      return { status: "error", message: "Profile ID wajib disertakan" };
    }

    const isEdit = !!id;
    const url = `${GOLANG_BASE}/transaction/group`;
    const method = isEdit ? "PATCH" : "POST";

    const body = {
      id,
      profile_id,
      branch_id,
      reference_number,
      transaction_date,
      description,
      customer_name,
      customer_phone: customer_phone || null,
      customer_address: customer_address || null,
      order_status,
      items: items.map((it) => ({
        name: it.name,
        amount: Number(it.amount),
        category_id: it.category_id || null,
        payment_method_id: it.payment_method_id,
        type: mapType(it.type),
        product_id: it.product_id || null,
        quantity: Number(it.quantity || 1),
      })),
    };

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      return { status: "error", message: data.error || "Gagal memproses transaksi" };
    }

    revalidatePath("/backend/tenant/sales");
    revalidatePath("/backend/tenant/sales/history");
    return {
      status: "success",
      data: {
        id: data.id,
        reference_number: data.reference_number,
        transaction_date: data.transaction_date,
        customer_name: data.customer_name,
      },
    };
  } catch (error) {
    console.error("savePOSTransactionAction error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal memproses transaksi",
    };
  }
}

// 4. Fetch Sales History Page Data
export async function getSalesHistoryPageData(payload: {
  search?: string;
  dateStart?: string;
  dateEnd?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const headers = await getHeaders();

    // Ambil profile & tenant info dari Golang
    const tenantRes = await fetch(`${GOLANG_BASE}/tenant-umkm`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!tenantRes.ok) {
      return { status: "error", message: "Gagal memuat profil UMKM dari server Go" };
    }
    const tenantData = await tenantRes.json();
    const profile = tenantData.profile;

    if (!profile) {
      return { status: "error", message: "Profil tidak ditemukan" };
    }

    const tenantOwnerId = profile.tenant_owner_id || profile.id;

    // Persiapkan query param untuk list transaksi
    const query = new URLSearchParams({
      profile_id: tenantOwnerId,
      page: String(payload.page || 1),
      limit: String(payload.limit || 15),
    });
    if (payload.search) query.append("search", payload.search);
    if (payload.dateStart) query.append("date_start", payload.dateStart);
    if (payload.dateEnd) query.append("date_end", payload.dateEnd);

    // Ambil data transaksi dari Golang
    const txRes = await fetch(`${GOLANG_BASE}/transaction/group?${query.toString()}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!txRes.ok) {
      return { status: "error", message: "Gagal mengambil data penjualan" };
    }
    const txData = await txRes.json();

    // Filter di frontend untuk memastikan hanya transaksi POS yang memiliki item produk (sale)
    // Serta hitung aggregate stats
    const rawList = txData.data || [];
    const formattedData = rawList.map((tx: any) => ({
      id: tx.id,
      reference_number: tx.reference_number,
      transaction_date: tx.transaction_date,
      total_income: Number(tx.total_income || 0),
      description: tx.description,
      customer_name: tx.customer_name,
      created_at: tx.created_at,
      branch_id: tx.branch_id,
      order_status: tx.order_status,
      transaction_items: (tx.transaction_items || []).map((it: any) => ({
        id: it.id,
        name: it.name,
        amount: Number(it.amount),
        quantity: it.quantity ? Number(it.quantity) : 1,
        product_id: it.product_id,
        payment_method_id: it.payment_method_id,
        categories: it.categories ? { name: it.categories.name } : null,
        payment_methods: it.payment_methods ? { name: it.payment_methods.name } : null,
      })),
    }));

    // Aggregate stats
    let totalRevenue = 0;
    let totalItems = 0;

    formattedData.forEach((tx: any) => {
      totalRevenue += tx.total_income;
      tx.transaction_items.forEach((it: any) => {
        if (it.product_id) {
          totalItems += it.quantity;
        }
      });
    });

    return {
      status: "success",
      businessName: profile.business_name || "SiPetto UMKM",
      data: formattedData,
      total: txData.total || 0,
      totalPages: txData.totalPages || 1,
      stats: {
        totalRevenue,
        totalItems,
      },
    };
  } catch (error) {
    console.error("getSalesHistoryPageData error:", error);
    return { status: "error", message: "Gagal mengambil data penjualan" };
  }
}

// 5. Delete Sales Transaction Action
export async function deleteSalesTransactionAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/transaction/group?id=${id}`, {
      method: "DELETE",
      headers
    });

    if (!res.ok) {
      const data = await res.json();
      return { status: "error", message: data.error || "Gagal menghapus data penjualan" };
    }

    revalidatePath("/backend/tenant/sales");
    revalidatePath("/backend/tenant/sales/history");
    return { status: "success" };
  } catch (error) {
    console.error("deleteSalesTransactionAction error:", error);
    return { status: "error", message: "Gagal menghapus data penjualan" };
  }
}
