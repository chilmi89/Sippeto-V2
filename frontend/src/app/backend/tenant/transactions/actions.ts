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

// 1. Fetch all transactions page data on the Server
export async function getTransactionPageData(editId?: string | null) {
  try {
    const headers = await getHeaders();

    // 1. Ambil profile & tenant info
    const profileRes = await fetch(`${GOLANG_BASE}/tenant-umkm`, { 
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!profileRes.ok) return { status: "error", message: "Gagal memuat profil bisnis" };
    const profileData = await profileRes.json();
    const profile = profileData.profile;

    // 2. Ambil categories
    const categoriesRes = await fetch(`${GOLANG_BASE}/kategori?profile_id=${profile.tenant_owner_id}&limit=100`, { 
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    const categoriesData = await categoriesRes.json();
    const categories = (categoriesData.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type === "INCOME" ? "pemasukan" : "pengeluaran"
    }));

    // 3. Ambil payment methods
    const pmRes = await fetch(`${GOLANG_BASE}/payment_kategori?profile_id=${profile.tenant_owner_id}&limit=100`, { 
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    const pmData = await pmRes.json();
    const paymentMethods = pmData.data || [];

    // 4. Ambil branches
    const branchesRes = await fetch(`${GOLANG_BASE}/branches`, { 
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    const branchesData = await branchesRes.json();
    const branches = branchesData.data || [];

    const initialBranchId = profile.branch_id || (branches[0]?.id || "");

    // 5. Ambil edit transaction jika ada
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
              amount: it.amount,
              category_id: it.category_id,
              payment_method_id: it.payment_method_id,
              type: it.type === "INCOME" ? "pemasukan" : "pengeluaran"
            }))
          };
        }
      }
    }

    // 6. Ambil 5 transaksi terbaru
    let recentTx: any[] = [];
    const recentQuery = new URLSearchParams({
      profile_id: profile.tenant_owner_id,
      limit: "5",
    });
    if (initialBranchId) {
      recentQuery.append("branch_id", initialBranchId);
    }
    const recentRes = await fetch(`${GOLANG_BASE}/transaction/group?${recentQuery.toString()}`, { 
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (recentRes.ok) {
      const rData = await recentRes.json();
      recentTx = (rData.data || []).map((tx: any) => ({
        id: tx.id,
        reference_number: tx.reference_number,
        transaction_date: tx.transaction_date,
        total_income: tx.total_income,
        total_expense: tx.total_expense,
        net_balance: tx.net_balance
      }));
    }

    return {
      status: "success",
      profile,
      categories,
      paymentMethods,
      branches,
      editTransaction,
      recentTransactions: recentTx,
      initialBranchId
    };
  } catch (error) {
    console.error("getTransactionPageData error:", error);
    return { status: "error", message: "Gagal memuat data transaksi" };
  }
}

// 2. Fetch recent transactions for a branch
export async function getRecentTransactionsAction(tenantOwnerId: string, branchId?: string) {
  try {
    const headers = await getHeaders();
    const query = new URLSearchParams({
      profile_id: tenantOwnerId,
      limit: "5",
    });
    if (branchId) {
      query.append("branch_id", branchId);
    }

    const res = await fetch(`${GOLANG_BASE}/transaction/group?${query.toString()}`, { 
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!res.ok) return { status: "error", message: "Gagal memuat transaksi terbaru" };
    const rData = await res.json();
    const data = (rData.data || []).map((tx: any) => ({
      id: tx.id,
      reference_number: tx.reference_number,
      transaction_date: tx.transaction_date,
      total_income: tx.total_income,
      total_expense: tx.total_expense,
      net_balance: tx.net_balance
    }));

    return { status: "success", data };
  } catch (error) {
    console.error("getRecentTransactionsAction error:", error);
    return { status: "error", message: "Gagal memuat transaksi terbaru" };
  }
}

// 3. Save or Update transaction
export async function saveTransactionAction(payload: {
  editId?: string | null;
  profile_id: string;
  branch_id: string | null;
  reference_number: string;
  transaction_date: string;
  description: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  order_status?: number;
  items: Array<{
    name: string;
    amount: number;
    category_id: string;
    payment_method_id: string;
    type: "pemasukan" | "pengeluaran";
  }>;
}) {
  try {
    const headers = await getHeaders();
    const isEdit = !!payload.editId;
    const url = `${GOLANG_BASE}/transaction/group`;
    const method = isEdit ? "PATCH" : "POST";
    const body = {
      ...payload,
      id: payload.editId
    };

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const data = await res.json();
      return { status: "error", message: data.error || "Gagal menyimpan transaksi" };
    }

    revalidatePath("/backend/tenant/transactions");
    revalidatePath("/backend/tenant/transactions/history");
    return { status: "success" };
  } catch (error) {
    console.error("saveTransactionAction error:", error);
    return { status: "error", message: "Gagal menyimpan transaksi" };
  }
}

// 4. Delete Transaction Action
export async function deleteTransactionAction(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/transaction/group?id=${id}`, {
      method: "DELETE",
      headers
    });

    if (!res.ok) {
      const data = await res.json();
      return { status: "error", message: data.error || "Gagal menghapus transaksi" };
    }

    revalidatePath("/backend/tenant/transactions");
    revalidatePath("/backend/tenant/transactions/history");
    return { status: "success" };
  } catch (error) {
    console.error("deleteTransactionAction error:", error);
    return { status: "error", message: "Gagal menghapus transaksi" };
  }
}

// 5. Fetch history transactions page data
export async function getHistoryPageData(payload: {
  search?: string;
  dateStart?: string;
  dateEnd?: string;
  page?: number;
  limit?: number;
  branchId?: string;
}) {
  try {
    const headers = await getHeaders();

    // 1. Ambil profile & tenant info
    const profileRes = await fetch(`${GOLANG_BASE}/tenant-umkm`, { 
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!profileRes.ok) return { status: "error", message: "Gagal memuat profil bisnis" };
    const profileData = await profileRes.json();
    const profile = profileData.profile;

    // 2. Ambil branches
    const branchesRes = await fetch(`${GOLANG_BASE}/branches`, { 
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    const branchesData = await branchesRes.json();
    const branches = branchesData.data || [];

    // 3. Ambil data transaksi dengan filter
    const query = new URLSearchParams({
      profile_id: profile.tenant_owner_id,
      page: String(payload.page || 1),
      limit: String(payload.limit || 10),
    });
    if (payload.search) query.append("search", payload.search);
    if (payload.dateStart) query.append("date_start", payload.dateStart);
    if (payload.dateEnd) query.append("date_end", payload.dateEnd);
    if (payload.branchId && payload.branchId !== "all") query.append("branch_id", payload.branchId);

    const res = await fetch(`${GOLANG_BASE}/transaction/group?${query.toString()}`, { 
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!res.ok) return { status: "error", message: "Gagal memuat riwayat transaksi" };
    const txData = await res.json();

    const data = (txData.data || []).map((tx: any) => ({
      id: tx.id,
      reference_number: tx.reference_number,
      transaction_date: tx.transaction_date,
      total_income: tx.total_income,
      total_expense: tx.total_expense,
      net_balance: tx.net_balance,
      description: tx.description,
      customer_name: tx.customer_name,
      customer_phone: tx.customer_phone,
      customer_address: tx.customer_address,
      order_status: tx.order_status,
      transaction_items: (tx.transaction_items || []).map((it: any) => ({
        id: it.id,
        name: it.name,
        amount: it.amount,
        type: it.type,
        quantity: it.quantity,
        product_id: it.product_id,
        categories: it.categories ? { name: it.categories.name } : null
      }))
    }));

    // Ambil total aggregate stats dari reports sales API
    const reportQuery = new URLSearchParams({
      profile_id: profile.tenant_owner_id,
      type: "daily",
    });
    if (payload.dateStart) reportQuery.append("date_start", payload.dateStart);
    if (payload.dateEnd) reportQuery.append("date_end", payload.dateEnd);
    if (payload.branchId && payload.branchId !== "all") reportQuery.append("branch_id", payload.branchId);

    const reportRes = await fetch(`${GOLANG_BASE}/reports/sales?${reportQuery.toString()}`, { 
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    let totalIncome = 0;
    let totalExpense = 0;
    let netBalance = 0;
    if (reportRes.ok) {
      const rep = await reportRes.json();
      totalIncome = rep.summary.total_income;
      totalExpense = rep.summary.total_expense;
      netBalance = rep.summary.net_balance;
    }

    return {
      status: "success",
      profile,
      data,
      total: txData.total ?? 0,
      totalPages: txData.totalPages ?? 1,
      branches,
      stats: {
        totalIncome,
        totalExpense,
        netBalance
      }
    };
  } catch (error) {
    console.error("getHistoryPageData error:", error);
    return { status: "error", message: "Gagal memuat riwayat transaksi" };
  }
}

// 6. Change Transaction Status Action
export async function changeTransactionStatusAction(id: string, newStatus: number) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${GOLANG_BASE}/transaction/group`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, order_status: newStatus })
    });

    if (!res.ok) {
      const data = await res.json();
      return { status: "error", message: data.error || "Gagal mengubah status transaksi" };
    }

    revalidatePath("/backend/tenant/transactions");
    revalidatePath("/backend/tenant/transactions/history");
    return { status: "success" };
  } catch (error) {
    console.error("changeTransactionStatusAction error:", error);
    return { status: "error", message: "Gagal mengubah status transaksi" };
  }
}
