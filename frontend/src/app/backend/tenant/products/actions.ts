"use server";

import { cookies } from "next/headers";
import { getBranchesAction } from "@/app/actions/branch";
import {
  getCategoriesAction,
  getProductsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction as deleteProductGlobalAction
} from "@/app/actions/product";

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

// 1. Fetch Products Page Data (Init)
export async function getProductsPageData() {
  try {
    const headers = await getHeaders();

    // Ambil profile & permissions dari /api/auth/me
    const meRes = await fetch(`${GOLANG_BASE}/auth/me`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!meRes.ok) {
      return { status: "error", message: "Gagal memuat profil autentikasi dari server Go" };
    }
    const meData = await meRes.json();
    const permissions = meData.permissions || [];

    if (!permissions.includes("kelola_produk")) {
      return { status: "forbidden", message: "Akses Ditolak" };
    }

    // Ambil data detail tenant untuk mendapatkan tenant_owner_id
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
    const branchId = profile.branch_id || null;

    // Fetch Branches dari Golang backend via Server Action
    const branchRes = await getBranchesAction(tenantOwnerId);
    let branches = branchRes.success ? (branchRes.data || []) : [];

    // Parallel Fetch (Products and Categories) dari Golang backend
    let [prodRes, categoryRes] = await Promise.all([
      branchId
        ? getProductsAction({ branch_id: branchId })
        : getProductsAction({ tenant_id: tenantOwnerId }),
      getCategoriesAction({ scope: "all", limit: 100, profile_id: tenantOwnerId })
    ]);

    let productsList = prodRes.success ? (prodRes.data || []) : [];
    let categories = categoryRes.success ? (categoryRes.data || []) : [];

    const branchMap = new Map(branches.map((b: any) => [b.id, b.name]));

    // Map products to include branch stock info
    const mappedProducts = productsList.map((prod: any) => {
      let currentBranchStock = 0;
      let currentBranchMinStock = 0;

      if (branchId) {
        currentBranchStock = prod.current_branch_stock ?? 0;
        currentBranchMinStock = prod.current_branch_min_stock ?? 0;
      }

      return {
        id: prod.id,
        profile_id: prod.profile_id,
        branch_id: prod.branch_id,
        category_id: prod.category_id,
        name: prod.name,
        description: prod.description,
        base_price: Number(prod.base_price),
        sell_price: Number(prod.sell_price),
        image_url: prod.image_url,
        is_active: prod.is_active ?? true,
        created_at: prod.created_at || "",
        product_categories: prod.product_categories
          ? { name: prod.product_categories.name }
          : null,
        branches: prod.branch_id ? { name: branchMap.get(prod.branch_id) || "Cabang" } : null,
        product_stocks: (prod.product_stocks || []).map((ps: any) => ({
          id: ps.id,
          branch_id: ps.branch_id,
          stock: ps.stock,
          min_stock: ps.min_stock,
          branches: {
            name: branchMap.get(ps.branch_id) || "Cabang"
          }
        })),
        current_branch_stock: currentBranchStock,
        current_branch_min_stock: currentBranchMinStock,
      };
    });

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
        branch_id: branchId,
        username: profile.username,
        userRole: meData.role_name || "",
        tenant_owner_id: tenantOwnerId,
      },
      products: mappedProducts,
      branches: branches.map((b: any) => ({ id: b.id, name: b.name })),
      categories: categories.map((c: any) => ({ id: c.id, name: c.name })),
    };
  } catch (error) {
    console.error("getProductsPageData error:", error);
    return { status: "error", message: "Gagal memuat data produk" };
  }
}

// 2. Save / Update Product Action
export async function saveProductAction(payload: {
  id?: string;
  profile_id: string;
  branch_id: string | null;
  category_id: string | null;
  name: string;
  description?: string | null;
  base_price: number;
  sell_price: number;
  image_url?: string | null;
  is_active: boolean;
  branch_stocks?: Array<{
    branch_id: string;
    stock: number;
    min_stock: number;
  }>;
}) {
  try {
    const {
      id,
      profile_id,
      branch_id,
      category_id,
      name,
      description,
      base_price,
      sell_price,
      image_url,
      is_active,
      branch_stocks,
    } = payload;

    if (!profile_id || !name) {
      return {
        status: "error",
        message: "Profile ID dan nama produk wajib diisi",
      };
    }

    if (id) {
      // Mode UPDATE
      const res = await updateProductAction({
        id,
        category_id,
        name,
        description,
        base_price: Number(base_price),
        sell_price: Number(sell_price),
        image_url,
        is_active,
        branch_stocks
      });

      if (!res.success) {
        return { status: "error", message: res.error || "Gagal memperbarui produk" };
      }
      return { status: "success", data: res.data };
    } else {
      // Mode CREATE
      const res = await createProductAction({
        profile_id,
        branch_id,
        category_id,
        name,
        description,
        base_price: Number(base_price),
        sell_price: Number(sell_price),
        image_url,
        is_active,
        branch_stocks
      });

      if (!res.success) {
        return { status: "error", message: res.error || "Gagal membuat produk baru" };
      }
      return { status: "success", data: res.data };
    }
  } catch (error) {
    console.error("saveProductAction error:", error);
    return { status: "error", message: "Gagal menyimpan data produk" };
  }
}

// 3. Delete Product Action
export async function deleteProductAction(id: string) {
  try {
    const res = await deleteProductGlobalAction(id);
    if (!res.success) {
      return { status: "error", message: res.error || "Gagal menghapus produk" };
    }
    return { status: "success" };
  } catch (error) {
    console.error("deleteProductAction error:", error);
    return { status: "error", message: "Gagal menghapus produk" };
  }
}
