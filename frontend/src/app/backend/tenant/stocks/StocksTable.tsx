"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
    Search,
    ArrowRightLeft,
    Activity,
    Package,
    Store,
    AlertTriangle,
    X,
    Building2,
    FileText,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowUp,
    ArrowDown,
    Hash,
    Tag,
    ClipboardList,
    Send,
    ChevronRight,
    History
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { adjustStockAction, transferStockAction } from "@/app/actions/stock";

interface Stock {
    id: string;
    product_id: string;
    branch_id: string;
    stock: number;
    min_stock: number;
    products: {
        name: string;
        sell_price: number;
    };
    branches: {
        name: string;
    };
}

interface Mutation {
    id: string;
    product_id: string;
    from_branch_id: string | null;
    to_branch_id: string | null;
    quantity: number;
    type: string;
    notes: string | null;
    created_at: string;
    products: {
        name: string;
    };
    from_branch: {
        name: string;
    } | null;
    to_branch: {
        name: string;
    } | null;
}

interface Branch {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
}

interface StocksTableProps {
  stocks: Stock[];
  mutations: Mutation[];
  branches: Branch[];
  products: Product[];
  profile: any;
}

function getTimeAgo(dateStr: string): string {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins}m lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}j lalu`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}h lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID", { dateStyle: "medium" });
}

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function StocksTable({
  stocks,
  mutations,
  branches,
  products,
  profile
}: StocksTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBranchFilter, setSelectedBranchFilter] = useState("all");

    const [isKontrolModalOpen, setIsKontrolModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
    
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [formStockQty, setFormStockQty] = useState<number | "">(0);
    const [formMinStockQty, setFormMinStockQty] = useState<number | "">(0);
    const [formKontrolNotes, setFormKontrolNotes] = useState("");

    const [formTransferProductId, setFormTransferProductId] = useState("");
    const [formTransferFromBranchId, setFormTransferFromBranchId] = useState("");
    const [formTransferToBranchId, setFormTransferToBranchId] = useState("");
    const [formTransferQty, setFormTransferQty] = useState<number | "">(0);
    const [formTransferNotes, setFormTransferNotes] = useState("");

    const isOwner = profile && !profile.branch_id;

    const filteredStocks = stocks.filter((s) => {
        if (s.stock === 0 && s.min_stock === 0) return false;
        const matchesSearch = s.products.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBranch = selectedBranchFilter === "all" || s.branch_id === selectedBranchFilter;
        return matchesSearch && matchesBranch;
    });

    const stats = useMemo(() => {
        const total = stocks.length;
        const lowStock = stocks.filter(s => s.stock <= s.min_stock).length;
        const critical = stocks.filter(s => s.stock === 0).length;
        return { total, lowStock, critical, branches: branches.length };
    }, [stocks, branches]);

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

    const openKontrolModal = (stock: Stock) => {
        setSelectedStock(stock);
        setFormStockQty(stock.stock);
        setFormMinStockQty(stock.min_stock);
        setFormKontrolNotes("");
        setIsKontrolModalOpen(true);
    };

    const openTransferModal = () => {
        setFormTransferProductId("");
        setFormTransferFromBranchId("");
        setFormTransferToBranchId("");
        setFormTransferQty("");
        setFormTransferNotes("");
        setIsTransferModalOpen(true);
    };

    const handleKontrolSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStock) return;
        try {
            setActionLoading(true);
            const res = await adjustStockAction({
                product_id: selectedStock.product_id,
                branch_id: selectedStock.branch_id,
                stock: formStockQty === "" ? 0 : Number(formStockQty),
                min_stock: formMinStockQty === "" ? 0 : Number(formMinStockQty),
                notes: formKontrolNotes || undefined
            });

            if (res.status === "success") {
                toast.success("Kontrol stok berhasil disimpan");
                setIsKontrolModalOpen(false);
                router.refresh();
            } else {
                toast.error(res.message || "Gagal melakukan kontrol stok.");
            }
        } catch (error) {
            console.error("Kontrol error:", error);
            toast.error("Kesalahan koneksi ke server.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formTransferFromBranchId === formTransferToBranchId) {
            toast.error("Cabang pengirim dan penerima tidak boleh sama.");
            return;
        }
        try {
            setActionLoading(true);
            const res = await transferStockAction({
                product_id: formTransferProductId,
                from_branch_id: formTransferFromBranchId,
                to_branch_id: formTransferToBranchId,
                quantity: formTransferQty === "" ? 0 : Number(formTransferQty),
                notes: formTransferNotes || undefined
            });

            if (res.status === "success") {
                toast.success("Transfer stok berhasil dilakukan");
                setIsTransferModalOpen(false);
                router.refresh();
            } else {
                toast.error(res.message || "Gagal melakukan transfer stok.");
            }
        } catch (error) {
            console.error("Transfer error:", error);
            toast.error("Kesalahan koneksi ke server.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ===== HEADER WITH GRADIENT & STATS ===== */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#030037] via-[#1a1a5e] to-[#2d2a7a] p-6 md:p-8 shadow-xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#3c39d6]/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                                <Package className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold text-white font-heading tracking-tight">
                                {isOwner ? "Manajemen Distribusi & Mutasi Stok" : "Daftar Stok & Kontrol Cabang"}
                            </h1>
                        </div>
                        <p className="text-sm text-white/60 ml-1">
                            {isOwner
                                ? "Pantau ketersediaan di semua cabang, lakukan transfer, atau kontrol stok."
                                : "Lihat stok produk di cabang Anda dan lakukan kontrol stok fisik."}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setIsMutationModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all font-bold text-sm rounded-xl shrink-0"
                        >
                            <History className="w-4 h-4" />
                            Riwayat Mutasi
                        </button>
                        {isOwner && (
                            <button
                                onClick={openTransferModal}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#030037] hover:bg-white/90 transition-all font-bold text-sm rounded-xl shadow-lg shadow-black/20"
                            >
                                <ArrowRightLeft className="w-4 h-4" />
                                Transfer Antar-Cabang
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                        <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                            <Package className="w-3 h-3" />
                            Total Item Stok
                        </div>
                        <div className="text-xl font-bold text-white">{stats.total}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                        <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                            <Building2 className="w-3 h-3" />
                            {isOwner ? "Total Cabang" : "Cabang Aktif"}
                        </div>
                        <div className="text-xl font-bold text-white">{stats.branches}</div>
                    </div>
                    <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-3.5 border border-amber-500/20">
                        <div className="flex items-center gap-2 text-amber-400/70 text-[10px] font-bold uppercase tracking-widest mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            Di Bawah Minimum
                        </div>
                        <div className="text-xl font-bold text-amber-300">{stats.lowStock}</div>
                    </div>
                    <div className="bg-rose-500/10 backdrop-blur-sm rounded-xl p-3.5 border border-rose-500/20">
                        <div className="flex items-center gap-2 text-rose-400/70 text-[10px] font-bold uppercase tracking-widest mb-1">
                            <X className="w-3 h-3" />
                            Stok Habis (0)
                        </div>
                        <div className="text-xl font-bold text-rose-300">{stats.critical}</div>
                    </div>
                </div>
            </div>

            {/* ===== FILTER & SEARCH BAR ===== */}
            <div className="bg-white border border-zinc-150 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari produk berdasarkan nama..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#3c39d6] focus:ring-4 focus:ring-[#3c39d6]/5 transition-all text-black placeholder-zinc-400 font-bold"
                    />
                </div>
                
                {isOwner && (
                    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-2.5 rounded-xl w-full md:w-auto shrink-0">
                        <Store className="w-4 h-4 text-zinc-400" />
                        <select
                            value={selectedBranchFilter}
                            onChange={(e) => setSelectedBranchFilter(e.target.value)}
                            className="bg-transparent border-0 text-black text-xs font-semibold focus:outline-none cursor-pointer w-full md:w-44 text-black bg-white"
                        >
                            <option value="all" className="text-black bg-white">Semua Cabang</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id} className="text-black bg-white">{b.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* ===== STOCK TABLE FULL WIDTH ===== */}
            <div className="bg-white border border-zinc-150 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                {filteredStocks.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-3">
                        <div className="p-4 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-full">
                            <Package className="w-10 h-10 text-zinc-300" />
                        </div>
                        <h3 className="text-lg font-bold text-[#030037]">Stok Tidak Ditemukan</h3>
                        <p className="text-sm text-zinc-500 max-w-md">
                            {stocks.length === 0
                                ? "Belum ada data stok produk untuk ditampilkan."
                                : "Tidak ada produk yang cocok dengan filter atau pencarian Anda."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                                    <th className="py-4 px-5">Produk</th>
                                    {isOwner && <th className="py-4 px-5">Cabang</th>}
                                    <th className="py-4 px-5 text-right">Harga Jual</th>
                                    <th className="py-4 px-5 text-center">Tingkat Stok</th>
                                    <th className="py-4 px-5 text-center">Min</th>
                                    <th className="py-4 px-5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700 font-medium">
                                {filteredStocks.map((s, idx) => {
                                    const isLow = s.stock <= s.min_stock;
                                    const isCritical = s.stock === 0;
                                    const stockPercent = s.min_stock > 0 ? Math.min(100, Math.round((s.stock / s.min_stock) * 100)) : 100;
                                    const barColor = isCritical ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500";
                                    const barWidth = isCritical ? 8 : Math.max(8, Math.min(100, stockPercent));

                                    return (
                                        <tr
                                            key={s.id}
                                            className="hover:bg-gradient-to-r hover:from-[#3c39d6]/[0.02] hover:to-transparent transition-all duration-200"
                                        >
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                                                        isCritical ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                                                    }`}>
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-[#030037] block leading-tight text-sm">
                                                            {s.products.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            {isOwner && (
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#3c39d6]/40" />
                                                        <span className="text-xs font-bold text-zinc-600">{s.branches.name}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="py-4 px-5 text-right">
                                                <span className="font-mono font-bold text-zinc-500 text-xs">
                                                    {formatCurrency(s.products.sell_price)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${
                                                            isCritical
                                                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                                                : isLow
                                                                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                                                                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                                        }`}>
                                                            {isCritical ? (
                                                                <X className="w-3 h-3" />
                                                            ) : isLow ? (
                                                                <AlertTriangle className="w-3 h-3" />
                                                            ) : (
                                                                <CheckCircle2 className="w-3 h-3" />
                                                            )}
                                                            {s.stock}
                                                        </span>
                                                    </div>
                                                    <div className="w-[80px] h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                                            style={{ width: `${barWidth}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] text-zinc-400 font-mono">pcs</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 text-center">
                                                <span className={`font-mono text-xs ${s.min_stock > 0 ? "text-zinc-400" : "text-zinc-300 italic"}`}>
                                                    {s.min_stock > 0 ? `${s.min_stock}` : "—"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-center">
                                                <button
                                                    onClick={() => openKontrolModal(s)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#3c39d6] hover:text-white text-[#3c39d6] bg-zinc-50 font-bold text-xs rounded-xl border border-zinc-200 hover:border-[#3c39d6] transition-all duration-200 hover:shadow-md hover:shadow-[#3c39d6]/20"
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                    Kontrol
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ===== MODAL KONTROL STOK ===== */}
            {isKontrolModalOpen && selectedStock && (
                <div className="fixed inset-0 bg-[#030037]/60 backdrop-blur-md z-[99] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl border border-zinc-150 overflow-hidden shadow-2xl shadow-black/20">
                        <div className="relative px-6 py-4 bg-gradient-to-r from-zinc-50 to-white border-b border-zinc-150 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#3c39d6]/10 rounded-xl">
                                    <ClipboardList className="w-4 h-4 text-[#3c39d6]" />
                                </div>
                                <h3 className="font-bold text-[#030037] font-heading">Kontrol Stok</h3>
                            </div>
                            <button onClick={() => setIsKontrolModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleKontrolSubmit} className="p-6 space-y-5">
                            <div className="bg-gradient-to-br from-zinc-50 to-white border border-zinc-200 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                                    <Package className="w-3.5 h-3.5" />
                                    <span className="uppercase tracking-wider">Produk</span>
                                </div>
                                <p className="text-sm font-bold text-[#030037]">{selectedStock.products.name}</p>
                                <div className="h-px bg-zinc-200 my-1.5" />
                                <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                                    <Store className="w-3.5 h-3.5" />
                                    <span className="uppercase tracking-wider">Cabang</span>
                                </div>
                                <p className="text-sm font-bold text-[#3c39d6]">{selectedStock.branches.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                                        <Hash className="w-3 h-3 inline mr-1" />
                                        Stok Fisik Baru
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formStockQty}
                                        onChange={(e) => setFormStockQty(e.target.value === "" ? "" : Number(e.target.value))}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-[#030037] font-bold focus:outline-none focus:border-[#3c39d6] focus:ring-4 focus:ring-[#3c39d6]/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                                        <AlertCircle className="w-3 h-3 inline mr-1" />
                                        Stok Minimum
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formMinStockQty}
                                        onChange={(e) => setFormMinStockQty(e.target.value === "" ? "" : Number(e.target.value))}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-[#030037] font-bold focus:outline-none focus:border-[#3c39d6] focus:ring-4 focus:ring-[#3c39d6]/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                                    <FileText className="w-3 h-3 inline mr-1" />
                                    Catatan Penyesuaian
                                </label>
                                <textarea
                                    value={formKontrolNotes}
                                    onChange={(e) => setFormKontrolNotes(e.target.value)}
                                    placeholder="Contoh: Selisih 2 barang pecah / kontrol bulanan..."
                                    rows={2}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-[#030037] font-bold focus:outline-none focus:border-[#3c39d6] focus:ring-4 focus:ring-[#3c39d6]/5 transition-all placeholder:text-zinc-400"
                                />
                            </div>

                            <div className="pt-4 border-t border-zinc-150 flex items-center justify-end gap-3">
                                <button type="button" onClick={() => setIsKontrolModalOpen(false)} className="px-5 py-2.5 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold text-xs rounded-xl transition-all">
                                    Batal
                                </button>
                                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 bg-[#3c39d6] text-white hover:bg-[#3c39d6]/90 font-bold text-xs rounded-xl shadow-lg shadow-[#3c39d6]/20 transition-all disabled:opacity-50 inline-flex items-center gap-2">
                                    {actionLoading ? (
                                        <>
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3 h-3" />
                                            Simpan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== MODAL TRANSFER ===== */}
            {isTransferModalOpen && isOwner && (
                <div className="fixed inset-0 bg-[#030037]/60 backdrop-blur-md z-[99] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl border border-zinc-150 overflow-hidden shadow-2xl shadow-black/20">
                        <div className="relative px-6 py-4 bg-gradient-to-r from-zinc-50 to-white border-b border-zinc-150 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                                </div>
                                <h3 className="font-bold text-[#030037] font-heading">Transfer Stok Antar-Cabang</h3>
                            </div>
                            <button onClick={() => setIsTransferModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleTransferSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                                    <Tag className="w-3 h-3 inline mr-1" />
                                    Pilih Produk
                                </label>
                                <select
                                    required
                                    value={formTransferProductId}
                                    onChange={(e) => setFormTransferProductId(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-[#030037] font-bold cursor-pointer focus:outline-none focus:border-[#3c39d6] focus:ring-4 focus:ring-[#3c39d6]/5 transition-all"
                                >
                                    <option value="" className="text-zinc-400">-- Pilih Produk --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id} className="text-[#030037]">{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                                        <ArrowUp className="w-3 h-3 inline mr-1 text-rose-500" />
                                        Dari Cabang
                                    </label>
                                    <select
                                        required
                                        value={formTransferFromBranchId}
                                        onChange={(e) => setFormTransferFromBranchId(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-[#030037] font-bold cursor-pointer focus:outline-none focus:border-[#3c39d6] focus:ring-4 focus:ring-[#3c39d6]/5 transition-all"
                                    >
                                        <option value="" className="text-zinc-400">-- Pilih --</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                                        <ArrowDown className="w-3 h-3 inline mr-1 text-emerald-500" />
                                        Ke Cabang
                                    </label>
                                    <select
                                        required
                                        value={formTransferToBranchId}
                                        onChange={(e) => setFormTransferToBranchId(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-[#030037] font-bold cursor-pointer focus:outline-none focus:border-[#3c39d6] focus:ring-4 focus:ring-[#3c39d6]/5 transition-all"
                                    >
                                        <option value="" className="text-zinc-400">-- Pilih --</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                                    <Hash className="w-3 h-3 inline mr-1" />
                                    Jumlah Barang
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    value={formTransferQty}
                                    onChange={(e) => setFormTransferQty(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-[#030037] font-bold focus:outline-none focus:border-[#3c39d6] focus:ring-4 focus:ring-[#3c39d6]/5 transition-all"
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                                    <FileText className="w-3 h-3 inline mr-1" />
                                    Catatan Transfer
                                </label>
                                <textarea
                                    value={formTransferNotes}
                                    onChange={(e) => setFormTransferNotes(e.target.value)}
                                    placeholder="Contoh: Kirim pakan kucing tambahan untuk event..."
                                    rows={2}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-[#030037] font-bold focus:outline-none focus:border-[#3c39d6] focus:ring-4 focus:ring-[#3c39d6]/5 transition-all placeholder:text-zinc-400"
                                />
                            </div>

                            <div className="pt-4 border-t border-zinc-150 flex items-center justify-end gap-3">
                                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-5 py-2.5 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold text-xs rounded-xl transition-all">
                                    Batal
                                </button>
                                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 bg-[#3c39d6] text-white hover:bg-[#3c39d6]/90 font-bold text-xs rounded-xl shadow-lg shadow-[#3c39d6]/20 transition-all disabled:opacity-50 inline-flex items-center gap-2">
                                    {actionLoading ? (
                                        <>
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3 h-3" />
                                            Lakukan Transfer
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== MODAL RIWAYAT MUTASI ===== */}
            {isMutationModalOpen && (
                <div className="fixed inset-0 bg-[#030037]/60 backdrop-blur-md z-[99] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-2xl border border-zinc-150 overflow-hidden shadow-2xl shadow-black/20 flex flex-col max-h-[85vh]">
                        <div className="relative px-6 py-4 bg-gradient-to-r from-zinc-50 to-white border-b border-zinc-150 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-xl">
                                    <History className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#030037] font-heading">Riwayat Mutasi Stok</h3>
                                    <p className="text-[10px] text-zinc-400">{mutations.length} log mutasi</p>
                                </div>
                            </div>
                            <button onClick={() => setIsMutationModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div data-lenis-prevent className="flex-1 overflow-y-auto p-5 [scrollbar-width:thin] scroll-smooth">
                            {mutations.length === 0 ? (
                                <div className="py-16 text-center flex flex-col items-center gap-3">
                                    <div className="p-3 bg-zinc-100 rounded-full">
                                        <ClipboardList className="w-6 h-6 text-zinc-300" />
                                    </div>
                                    <p className="text-zinc-400 text-sm italic">Belum ada riwayat mutasi stok.</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-[#3c39d6]/30 via-zinc-200 to-transparent" />
                                    {mutations.map((m) => {
                                        const isTransfer = m.type === "TRANSFER";
                                        const isRestock = m.type === "RESTOCK";
                                        const isSale = m.type === "SALE";

                                        const typeConfig = isTransfer
                                            ? { icon: ArrowRightLeft, color: "bg-blue-100 text-blue-600 border-blue-200", dot: "bg-blue-500" }
                                            : isRestock
                                                ? { icon: TrendingUp, color: "bg-emerald-100 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" }
                                                : isSale
                                                    ? { icon: TrendingDown, color: "bg-amber-100 text-amber-600 border-amber-200", dot: "bg-amber-500" }
                                                    : { icon: Activity, color: "bg-zinc-100 text-zinc-600 border-zinc-200", dot: "bg-zinc-400" };

                                        const TypeIcon = typeConfig.icon;

                                        return (
                                            <div key={m.id} className="relative flex gap-4 pl-2 group">
                                                <div className="relative flex flex-col items-center shrink-0 pt-2">
                                                    <div className={`w-3 h-3 rounded-full ring-4 ring-white ${typeConfig.dot} z-10 group-hover:scale-125 transition-transform`} />
                                                </div>
                                                <div className="flex-1 pb-5">
                                                    <div className="bg-white border border-zinc-200 hover:border-[#3c39d6]/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <Package className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                                                <span className="text-sm font-bold text-[#030037] truncate max-w-[200px]" title={m.products.name}>
                                                                    {m.products.name}
                                                                </span>
                                                            </div>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide border shrink-0 ${typeConfig.color}`}>
                                                                <TypeIcon className="w-2.5 h-2.5" />
                                                                {m.type}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                            <span className="flex items-center gap-1">
                                                                Kuantitas:
                                                                <strong className={`font-bold font-mono ${
                                                                    isSale ? "text-amber-600" : isRestock ? "text-emerald-600" : "text-blue-600"
                                                                }`}>
                                                                    {isSale ? "-" : isRestock ? "+" : ""}{m.quantity}
                                                                </strong>
                                                                <span className="text-zinc-400">pcs</span>
                                                            </span>
                                                            <span className="text-zinc-300">|</span>
                                                            <span className="flex items-center gap-1 text-zinc-400">
                                                                <Clock className="w-3 h-3" />
                                                                <span title={formatDateTime(m.created_at)}>{getTimeAgo(m.created_at)}</span>
                                                            </span>
                                                        </div>
                                                        {isTransfer && m.from_branch && m.to_branch && (
                                                            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500 bg-zinc-50 rounded-lg px-3 py-1.5 border border-zinc-100">
                                                                <Store className="w-3 h-3 text-zinc-400" />
                                                                <span>{m.from_branch.name}</span>
                                                                <ChevronRight className="w-3 h-3 text-emerald-500" />
                                                                <span>{m.to_branch.name}</span>
                                                            </div>
                                                        )}
                                                        {!isTransfer && (m.to_branch || m.from_branch) && (
                                                            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
                                                                <Store className="w-3 h-3 text-zinc-400" />
                                                                <span>{m.to_branch?.name || m.from_branch?.name}</span>
                                                            </div>
                                                        )}
                                                        {m.notes && (
                                                            <p className="text-[10px] text-zinc-400 italic mt-2 pt-2 border-t border-zinc-100 leading-relaxed">
                                                                &ldquo;{m.notes}&rdquo;
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
