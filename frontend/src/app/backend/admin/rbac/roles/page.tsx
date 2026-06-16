"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Plus, 
  Search,
  ChevronLeft, 
  ChevronRight,
  Filter,
  Trash2,
  Edit
} from "lucide-react";
import FullPageLoader from "@/components/layout/FullPageLoader";
import SectionLoader from "@/components/layout/SectionLoader";
import Link from "next/link";
import { toast } from "react-toastify";

interface Role {
  id: string;
  name: string;
  created_at: string;
}

const getRoleStyle = (name: string) => {
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colors = [
    { bg: "bg-blue-100 text-blue-600" },
    { bg: "bg-purple-100 text-purple-600" },
    { bg: "bg-emerald-100 text-emerald-600" },
    { bg: "bg-orange-100 text-orange-600" },
    { bg: "bg-rose-100 text-rose-600" },
  ];
  const style = colors[hash % colors.length];
  const initial = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return { style, initial };
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/backend/role");
      if (!response.ok) throw new Error("Gagal mengambil data peran");
      const data = await response.json();
      setRoles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/backend/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menambah peran");
      }

      setNewRoleName("");
      setIsModalOpen(false);
      toast.success("Peran berhasil ditambahkan!");
      fetchRoles();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah peran");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-full pb-8 animate-in fade-in duration-500">
      {loading && <FullPageLoader />}
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="w-4 h-[2px] bg-primary rounded-full"></div>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Access Control</span>
          </div>
          <h1 className="text-3xl font-bold text-[#030037] tracking-tighter leading-none">
            Master <span className="text-primary font-medium">Peran</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 max-w-xl">
            Kelola informasi dasar dan metadata peran sistem untuk mengatur hierarki akses.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#030037] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-zinc-200/50 active:scale-95 transition-all group border border-white/5"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Tambah Peran Baru
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-xl shadow-zinc-200/10 overflow-hidden flex flex-col">
        {/* Table Filter Area */}
        <div className="px-8 py-6 border-b border-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama peran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-lg py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm font-medium transition-all"
              suppressHydrationWarning
            />
          </div>
        </div>

      {/* Table Section */}
        {/* The Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Identitas Peran</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Metadata</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                   <td colSpan={4} className="py-24">
                      <SectionLoader text="Mengambil Data Peran..." />
                   </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-rose-500">
                      <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                      <button onClick={() => fetchRoles()} className="text-[10px] underline font-black text-zinc-400 hover:text-zinc-600 uppercase tracking-widest">Coba Lagi</button>
                    </div>
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-zinc-400">
                      <ShieldCheck className="w-12 h-12 opacity-10" />
                      <p className="text-xs font-black uppercase tracking-widest leading-none">Tidak ada peran ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const { style, initial } = getRoleStyle(role.name);
                  return (
                    <tr key={role.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-5">
                        <Link href={`/backend/admin/rbac/roles/${role.id}`} className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-lg ${style.bg} flex items-center justify-center font-bold text-sm tracking-tight border border-black/5 shadow-sm`}>
                            {initial}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-zinc-800 tracking-tight uppercase hover:text-primary transition-colors">{role.name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Klik konfigurasi izin</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-bold text-zinc-500">
                             {new Date(role.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                           </span>
                           <span className="text-[9px] font-black text-zinc-200 uppercase tracking-widest">STAMP REGISTRY</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[11px] font-bold tracking-tighter text-emerald-500 uppercase">
                            Aktif
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <Link 
                            href={`/backend/admin/rbac/roles/${role.id}`}
                            className="p-2 text-zinc-400 hover:text-primary transition-all hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 shadow-sm active:scale-90"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button className="p-2 text-zinc-400 hover:text-rose-500 transition-all hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 shadow-sm active:scale-90">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Pagination (Visual Only for now) */}
       {!loading && !error && filteredRoles.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-8">
             <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-800 transition-all">
               <ChevronLeft className="w-4 h-4" />
             </button>
             <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white font-black text-xs shadow-lg shadow-primary/20">
               1
             </button>
             <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-800 transition-all">
               <ChevronRight className="w-4 h-4" />
             </button>
          </div>
       )}

       {/* Modal Tambah Peran */}
       {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-[#030037]/40 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            />
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 border border-zinc-100">
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-800 tracking-tight font-heading uppercase">Buat Peran Baru</h3>
                  <p className="text-xs font-bold text-zinc-400">Tentukan nama peran untuk mengatur hak akses pengguna.</p>
                </div>
                
                <form onSubmit={handleAddRole} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nama Peran</label>
                    <input 
                      autoFocus
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Contoh: Administrator Toko"
                      className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-black text-zinc-950 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-zinc-300 shadow-inner"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting || !newRoleName.trim()}
                      className="flex-[2] px-8 py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      Simpan Peran
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
       )}
    </div>
  );
}