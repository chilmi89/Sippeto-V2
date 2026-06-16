"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, 
    Filter, 
    Package, 
    Layers, 
    DollarSign, 
    Eye, 
    AlertCircle,
    Building2,
    BarChart3
} from "lucide-react";
import SectionLoader from "@/components/layout/SectionLoader";

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
    product_categories: {
        name: string;
    } | null;
    profiles: {
        business_name: string | null;
        full_name: string | null;
        email: string;
    };
    product_stocks: {
        id: string;
        stock: number;
    }[];
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTenant, setSelectedTenant] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");

    // Fetch data produk global
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/backend/products");
            if (res.ok) {
                const json = await res.json();
                setProducts(json.data || []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Ekstrak list tenant unik untuk filter dropdown
    const uniqueTenants = Array.from(
        new Set(products.map((p) => p.profiles?.business_name || p.profiles?.full_name || "Tanpa Nama"))
    );

    // Filter produk berdasarkan input pencarian dan filter dropdown
    const filteredProducts = products.filter((p) => {
        const matchesSearch = 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (p.profiles?.business_name && p.profiles.business_name.toLowerCase().includes(searchQuery.toLowerCase()));

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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white font-heading">Monitoring Produk Global</h1>
                    <p className="text-sm text-white/60">Lihat dan awasi katalog produk yang dijual oleh seluruh Tenant/UMKM di dalam sistem.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    <div>
                        <span className="text-[10px] text-white/40 block leading-none font-bold uppercase tracking-wider">Total Produk Terdaftar</span>
                        <span className="text-sm font-bold text-white leading-none">{products.length} Items</span>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative w-full lg:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                        type="text" 
                        placeholder="Cari nama produk atau nama toko..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-white/30"
                    />
                </div>
                <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl w-full md:w-auto">
                        <Building2 className="w-4 h-4 text-white/40" />
                        <select 
                            value={selectedTenant}
                            onChange={(e) => setSelectedTenant(e.target.value)}
                            className="bg-transparent border-0 text-white text-xs font-semibold focus:outline-none cursor-pointer w-full md:w-44"
                        >
                            <option value="all" className="bg-[#030037] text-white">Semua Tenant</option>
                            {uniqueTenants.map((tName) => (
                                <option key={tName} value={tName} className="bg-[#030037] text-white">{tName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl w-full md:w-auto">
                        <Filter className="w-4 h-4 text-white/40" />
                        <select 
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-transparent border-0 text-white text-xs font-semibold focus:outline-none cursor-pointer w-full md:w-36"
                        >
                            <option value="all" className="bg-[#030037] text-white">Semua Status</option>
                            <option value="active" className="bg-[#030037] text-white">Aktif</option>
                            <option value="inactive" className="bg-[#030037] text-white">Nonaktif</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Products Table Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12">
                        <SectionLoader />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-3">
                        <div className="p-4 bg-white/5 rounded-full text-white/20">
                            <Package className="w-12 h-12" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Produk Tidak Ditemukan</h3>
                        <p className="text-sm text-white/50 max-w-md">Belum ada produk terdaftar atau filter pencarian Anda tidak mencocokkan produk apa pun.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-wider font-bold text-white/50">
                                    <th className="py-4 px-6">Info Produk</th>
                                    <th className="py-4 px-6">Tenant/Toko</th>
                                    <th className="py-4 px-6">Kategori</th>
                                    <th className="py-4 px-6 text-right">Harga Modal</th>
                                    <th className="py-4 px-6 text-right">Harga Jual</th>
                                    <th className="py-4 px-6 text-center">Stok Global</th>
                                    <th className="py-4 px-6 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-white/80">
                                {filteredProducts.map((product) => {
                                    const totalStock = product.product_stocks?.reduce((sum, s) => sum + s.stock, 0) ?? 0;
                                    return (
                                        <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-6 font-bold">
                                                <div className="flex items-center gap-3">
                                                    {product.image_url ? (
                                                        <img 
                                                            src={product.image_url} 
                                                            alt={product.name} 
                                                            className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0" 
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-white/30 shrink-0">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-bold text-white block leading-tight">{product.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-white block leading-tight">
                                                            {product.profiles?.business_name || "UMKM SiPetto"}
                                                        </span>
                                                        <span className="text-[10px] text-white/40 block mt-0.5">
                                                            {product.profiles?.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {product.product_categories ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#866e98]/20 text-[#c8b3d6]">
                                                        <Layers className="w-3 h-3" />
                                                        {product.product_categories.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-white/30 text-xs italic">Tanpa Kategori</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right font-semibold font-mono text-rose-300">
                                                {formatCurrency(product.base_price)}
                                            </td>
                                            <td className="py-4 px-6 text-right font-semibold font-mono text-emerald-400">
                                                {formatCurrency(product.sell_price)}
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold font-mono">
                                                <span className={`px-2 py-1 rounded-lg text-xs ${
                                                    totalStock === 0 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                                                }`}>
                                                    {totalStock} pcs
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
                                                    product.is_active 
                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                                        : "bg-white/5 text-white/40 border border-white/10"
                                                }`}>
                                                    {product.is_active ? "Aktif" : "Nonaktif"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
