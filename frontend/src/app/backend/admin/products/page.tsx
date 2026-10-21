"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Search,
  Filter,
  Package,
  Layers,
  Building2,
  BarChart3,
  RefreshCw,
  Boxes,
  CheckCircle2,
  XCircle,
  ChevronDown
} from "lucide-react";
import { getProductsAction } from "@/app/actions/product";

interface ProductStock {
  id: string;
  stock: number;
}

interface ProductCategory {
  name: string;
}

interface ProductProfile {
  business_name: string | null;
  full_name: string | null;
  email: string;
}

interface Product {
  id: string;
  profile_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price: number;
  sell_price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  product_categories: ProductCategory | null;
  profiles: ProductProfile | null;
  product_stocks: ProductStock[];
}

// ─── Smart Product Image Component with Fallback ──────────────────────────────
function ProductImage({ src, alt }: { src: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  // Transform URL jika menunjuk ke localhost:9000 (MinIO lokal)
  const resolvedSrc = React.useMemo(() => {
    if (!src) return null;
    if (src.includes("localhost:9000")) {
      // Alihkan ke proxy /storage-bucket Next.js
      return src.replace(/http:\/\/localhost:9000/g, "/storage-bucket");
    }
    return src;
  }, [src]);

  if (!resolvedSrc || hasError) {
    return (
      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 shrink-0 border border-zinc-200">
        <Package className="w-5 h-5 text-zinc-400" />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-10 h-10 object-cover rounded-xl border border-zinc-200 shrink-0 shadow-sm transition-transform hover:scale-110 duration-200"
    />
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const fetchProducts = () => {
    startTransition(async () => {
      const result = await getProductsAction();
      if (result.error) {
        setError(result.error);
      } else {
        setProducts((result.data as Product[]) || []);
        setError(null);
      }
    });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Ekstrak list tenant unik untuk filter dropdown
  const uniqueTenants = Array.from(
    new Set(products.map((p) => p.profiles?.business_name || p.profiles?.full_name || "Tanpa Nama"))
  ).filter(Boolean);

  // Total stok global keseluruhan
  const totalGlobalStockAll = products.reduce((acc, p) => {
    return acc + (p.product_stocks?.reduce((sum, s) => sum + s.stock, 0) ?? 0);
  }, 0);

  // Filter produk berdasarkan input pencarian dan filter dropdown
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.profiles?.business_name && p.profiles.business_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.profiles?.email && p.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const tenantName = p.profiles?.business_name || p.profiles?.full_name || "Tanpa Nama";
    const matchesTenant = selectedTenant === "all" || tenantName === selectedTenant;

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && p.is_active) ||
      (selectedStatus === "inactive" && !p.is_active);

    return matchesSearch && matchesTenant && matchesStatus;
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-[2px] bg-primary rounded-full" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Katalog Produk Global
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#030037] tracking-tighter leading-none">
            Monitoring <span className="text-primary font-medium">Produk Global</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 max-w-xl">
            Awasi seluruh katalog barang yang terdaftar dan dijual oleh para tenant UMKM di ekosistem SiPetto.
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white border border-zinc-200/80 px-4 py-2 rounded-xl shadow-sm">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider leading-none">
                Total Produk
              </span>
              <span className="text-sm font-extrabold text-[#030037] leading-tight">
                {products.length} Items
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white border border-zinc-200/80 px-4 py-2 rounded-xl shadow-sm">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider leading-none">
                Stok Global
              </span>
              <span className="text-sm font-extrabold text-[#030037] leading-tight">
                {totalGlobalStockAll.toLocaleString("id-ID")} Pcs
              </span>
            </div>
          </div>

          <button
            onClick={fetchProducts}
            disabled={isPending}
            className="p-2.5 bg-white border border-zinc-200/80 rounded-xl text-zinc-600 hover:text-primary hover:border-primary/30 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari nama produk, nama toko, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/40 transition-all"
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto">
          {/* Filter Tenant */}
          <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 w-full md:w-auto focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white">
            <Building2 className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="bg-transparent border-0 text-zinc-800 text-xs font-bold focus:outline-none cursor-pointer w-full md:w-44 pr-6 appearance-none"
            >
              <option value="all">Semua Tenant</option>
              {uniqueTenants.map((tName) => (
                <option key={tName} value={tName}>
                  {tName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 pointer-events-none" />
          </div>

          {/* Filter Status */}
          <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 w-full md:w-auto focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white">
            <Filter className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-0 text-zinc-800 text-xs font-bold focus:outline-none cursor-pointer w-full md:w-36 pr-6 appearance-none"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Products Table Card ── */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col">
        {error ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Gagal Memuat Data Produk</h3>
            <p className="text-xs text-zinc-500 max-w-sm">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-2 px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
            >
              Coba Lagi
            </button>
          </div>
        ) : isPending && products.length === 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] uppercase tracking-wider font-bold text-zinc-600">
                  <th className="py-4 px-6">Info Produk</th>
                  <th className="py-4 px-6">Tenant/Toko</th>
                  <th className="py-4 px-6">Kategori</th>
                  <th className="py-4 px-6 text-right">Harga Modal</th>
                  <th className="py-4 px-6 text-right">Harga Jual</th>
                  <th className="py-4 px-6 text-center">Stok Global</th>
                  <th className="py-4 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-5 px-6">
                        <div className="h-4 bg-zinc-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center gap-3">
            <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-400">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-800">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-zinc-500 max-w-md">
              Belum ada produk terdaftar atau filter pencarian tidak mencocokkan produk apa pun.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] uppercase tracking-wider font-bold text-zinc-600">
                  <th className="py-4 px-6">Info Produk</th>
                  <th className="py-4 px-6">Tenant / Toko</th>
                  <th className="py-4 px-6">Kategori</th>
                  <th className="py-4 px-6 text-right">Harga Modal</th>
                  <th className="py-4 px-6 text-right">Harga Jual</th>
                  <th className="py-4 px-6 text-center">Stok Global</th>
                  <th className="py-4 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredProducts.map((product) => {
                  const totalStock = product.product_stocks?.reduce((sum, s) => sum + s.stock, 0) ?? 0;
                  const tenantName = product.profiles?.business_name || product.profiles?.full_name || "UMKM SiPetto";

                  return (
                    <tr key={product.id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Info Produk & Thumbnail */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <ProductImage src={product.image_url} alt={product.name} />
                          <div>
                            <span className="font-bold text-zinc-900 block leading-tight text-sm">
                              {product.name}
                            </span>
                            {product.description && (
                              <span className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 max-w-xs font-normal">
                                {product.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tenant/Toko */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-zinc-800 block text-xs leading-tight">
                              {tenantName}
                            </span>
                            {product.profiles?.email && (
                              <span className="text-[10px] text-zinc-400 block font-medium mt-0.5 font-mono">
                                {product.profiles.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-4 px-6">
                        {product.product_categories?.name ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#866e98]/10 text-[#866e98] border border-[#866e98]/20">
                            <Layers className="w-3 h-3" />
                            {product.product_categories.name}
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs italic">Tanpa Kategori</span>
                        )}
                      </td>

                      {/* Harga Modal */}
                      <td className="py-4 px-6 text-right font-semibold font-mono text-xs text-zinc-500">
                        {formatCurrency(product.base_price)}
                      </td>

                      {/* Harga Jual */}
                      <td className="py-4 px-6 text-right font-bold font-mono text-sm text-emerald-600">
                        {formatCurrency(product.sell_price)}
                      </td>

                      {/* Stok Global */}
                      <td className="py-4 px-6 text-center font-bold font-mono">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            totalStock === 0
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {totalStock.toLocaleString("id-ID")} pcs
                        </span>
                      </td>

                      {/* Status Aktif/Nonaktif */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            product.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                          }`}
                        >
                          {product.is_active ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                              Nonaktif
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Info */}
        {!error && filteredProducts.length > 0 && (
          <div className="px-6 py-3.5 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Menampilkan <strong>{filteredProducts.length}</strong> dari <strong>{products.length}</strong> produk
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">
              Data tersinkronisasi otomatis dengan server SiPetto
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
