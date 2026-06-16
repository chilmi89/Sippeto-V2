"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  Gem, 
  Search, 
  Download, 
  MoreHorizontal, 
  Eye, 
  Ban, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import FullPageLoader from "@/components/layout/FullPageLoader";
import SectionLoader from "@/components/layout/SectionLoader";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  full_name: string | null;
  business_name: string | null;
  email: string;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
  avatar_url: string | null;
  roles: { name: string } | null;
}

interface Stats {
  total: number;
  aktif: number;
  nonaktif: number;
  menunggu: number;
}

interface PaginatedResponse {
  data: Tenant[];
  total: number;
  page: number;
  totalPages: number;
  stats: Stats;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const API_URL = "/api/backend/admin/tenant";

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, aktif: 0, nonaktif: 0, menunggu: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Filters & Pagination
  const [activeTab, setActiveTab] = useState("Semua"); // Semua, Aktif, Ditangguhkan
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam = 
        activeTab === "Aktif" ? "aktif" : 
        activeTab === "Ditangguhkan" ? "nonaktif" : 
        "semua";

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        status: statusParam,
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const res = await fetch(`${API_URL}?${params}`);
      if (res.ok) {
        const json: PaginatedResponse = await res.json();
        setTenants(json.data);
        setTotalPages(json.totalPages);
        setStats(json.stats);
      } else {
        toast.error("Gagal mengambil data tenant");
      }
    } catch {
      toast.error("Kesalahan jaringan saat mengambil data");
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab, debouncedSearch]);

  useEffect(() => {
    setMounted(true);
    fetchTenants();
  }, [fetchTenants]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(API_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });

      if (res.ok) {
        toast.success(`Status tenant berhasil ${!currentStatus ? 'diaktifkan' : 'ditangguhkan'}`);
        fetchTenants();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memperbarui status");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    }
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "??";
  };

  const statItems = [
    { label: "Total Tenant", value: stats.total.toLocaleString(), sub: "Seluruh ekosistem", color: "text-blue-600", icon: Users },
    { label: "Tenant Aktif", value: stats.aktif.toLocaleString(), sub: `${((stats.aktif / (stats.total || 1)) * 100).toFixed(1)}% dari total`, color: "text-emerald-500", icon: TrendingUp },
    { label: "Ditangguhkan", value: stats.nonaktif.toLocaleString(), sub: "Akses dibatasi", color: "text-amber-500", icon: Ban },
    { label: "Menunggu Verifikasi", value: stats.menunggu.toLocaleString(), sub: "Belum aktif", color: "text-rose-500", icon: Clock },
  ];

  if (!mounted) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-full pb-8 opacity-0">
        <FullPageLoader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-full pb-8 animate-in fade-in duration-500">
      {isLoading && <FullPageLoader />}
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="w-4 h-[2px] bg-primary rounded-full"></div>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Mitra Bisnis</span>
          </div>
          <h1 className="text-3xl font-bold text-[#030037] tracking-tighter leading-none">
            Manajemen <span className="text-primary font-medium">Tenant</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 max-w-xl">
            Kelola dan pantau semua mitra bisnis dalam ekosistem operasional dan pertumbuhan SiPetto.
          </p>
        </div>
        
        <div className="flex bg-zinc-50 p-1 rounded-xl border border-zinc-100 shadow-sm self-start">
          {["Semua", "Aktif", "Ditangguhkan"].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-8 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-[#030037] text-white shadow-lg shadow-zinc-200"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
              suppressHydrationWarning
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((stat) => (
          <div key={stat.label} className="bg-white p-7 rounded-xl border border-zinc-100 shadow-xl shadow-zinc-200/10 group hover:scale-[1.02] hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer relative overflow-hidden">
            {/* Interactive Glow Effect */}
            <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-zinc-50 rounded-full group-hover:bg-primary/5 transition-colors duration-500" />
            
            <div className="relative z-10 space-y-5">
              <div className="flex justify-between items-start">
                <div className={`p-2.5 bg-zinc-50 rounded-xl group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300`}>
                  <stat.icon className={`w-4 h-4 ${stat.color} opacity-80 group-hover:opacity-100`} />
                </div>
              </div>
              <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                    {stat.label}
                  </p>
                <h2 className="text-3xl font-bold text-[#030037] tracking-tighter group-hover:text-primary transition-colors">{stat.value}</h2>
                <div className="flex items-center gap-1.5 pt-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.sub}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-xl shadow-zinc-200/10 overflow-hidden flex flex-col">
        {/* Table Header/Filter */}
        <div className="px-8 py-6 border-b border-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Filter nama atau bisnis..." 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-lg py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm font-medium transition-all"
              suppressHydrationWarning
            />
          </div>
          <button className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 text-xs font-bold uppercase tracking-widest transition-colors px-4 py-2 hover:bg-zinc-100 rounded-lg active:scale-95">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Identitas Tenant</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Alamat Digital</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Timeline</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Otoritas</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Aksi Kendali</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {tenants.length > 0 ? (
                tenants.map((tenant) => {
                  const name = tenant.business_name || tenant.full_name || "Tanpa Nama";
                  return (
                    <tr key={tenant.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {tenant.avatar_url ? (
                            <img src={tenant.avatar_url} alt="" className="w-11 h-11 rounded-lg object-cover shadow-sm border border-zinc-100" />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm tracking-tight border border-primary/5 uppercase shadow-sm">
                              {getInitials(name)}
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-zinc-800 tracking-tight">{name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[150px]">ID: {tenant.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-zinc-500">{tenant.email}</td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-zinc-500">{new Date(tenant.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                           <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">PROFIL TERDAFTAR</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${tenant.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                          <span className={`text-[11px] font-bold tracking-tighter ${tenant.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tenant.is_active ? 'Aktif' : 'Ditangguhkan'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button className="p-2 text-zinc-400 hover:text-primary transition-all hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 shadow-sm active:scale-90">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => toggleStatus(tenant.id, tenant.is_active)}
                            className={`p-2 transition-all hover:bg-zinc-50 rounded-lg border border-transparent shadow-sm active:scale-90 ${
                            tenant.is_active ? 'text-zinc-400 hover:text-rose-500 hover:border-rose-100' : 'text-zinc-400 hover:text-emerald-500 hover:border-emerald-100'
                          }`}>
                            {tenant.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center">
                        <Users className="w-6 h-6 text-zinc-200" />
                      </div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        Tidak ada tenant ditemukan
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-8 py-6 bg-zinc-50/30 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-zinc-50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {isLoading ? "Sedang memuat..." : `Menampilkan ${tenants.length} dari ${stats.total.toLocaleString()} Tenant`}
          </p>
          
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white rounded-lg border border-zinc-100 text-zinc-400 hover:text-primary transition-all hover:shadow-md active:scale-95 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const p = i + 1; // Simple pagination for now
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      page === p 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-white border border-zinc-100 text-zinc-500 hover:bg-zinc-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-white rounded-lg border border-zinc-100 text-zinc-400 hover:text-primary transition-all hover:shadow-md active:scale-95 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
