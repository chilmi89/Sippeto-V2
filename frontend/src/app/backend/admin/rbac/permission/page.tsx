"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Plus, 
  Search,
  Filter,
  Trash2,
  Edit,
  ChevronRight,
  ShieldAlert,
  Save,
  X
} from "lucide-react";
import FullPageLoader from "@/components/layout/FullPageLoader";
import SectionLoader from "@/components/layout/SectionLoader";
import Link from "next/link";
import { toast } from "react-toastify";

interface Permission {
  id: string;
  name: string;
  created_at: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPermissionName, setNewPermissionName] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/backend/permission");
      if (!response.ok) throw new Error("Gagal mengambil data izin");
      const data = await response.json();
      setPermissions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermissionName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/backend/permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPermissionName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menambah izin");
      }

      setNewPermissionName("");
      setIsCreateModalOpen(false);
      toast.success("Izin baru berhasil diregistrasi!");
      fetchPermissions();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus izin ini? Aksi ini akan mempengaruhi matrix otoritas yang ada.")) return;

    try {
      const response = await fetch(`/api/backend/permission/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Gagal menghapus izin");
      
      toast.success("Izin telah dihapus");
      fetchPermissions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };



  const filteredPermissions = permissions.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-full pb-8 animate-in fade-in duration-500">
      {loading && <FullPageLoader />}
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest px-1">
        <Link href="/backend/admin/rbac" className="hover:text-primary transition-all">RBAC Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary italic">Registri Izin</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="w-4 h-[2px] bg-primary rounded-full"></div>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Permission Registry</span>
          </div>
          <h1 className="text-3xl font-bold text-[#030037] tracking-tighter leading-none">
            Master <span className="text-primary font-medium">Izin</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 max-w-xl">
            Kelola daftar kemampuan granular dalam ekosistem sistem untuk pemetaan matrix akses.
          </p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#030037] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-zinc-200/50 active:scale-95 transition-all group border border-white/5"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Tambah Izin Baru
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
              placeholder="Cari kemampuan/izin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-lg py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm font-medium transition-all"
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Nama Kemampuan</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Metadata</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                   <td colSpan={3} className="py-24">
                      <SectionLoader text="Mengambil Data Izin..." />
                   </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-rose-500">
                      <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                      <button onClick={() => fetchPermissions()} className="text-[10px] underline font-black text-zinc-400 hover:text-zinc-600 uppercase tracking-widest">Coba Lagi</button>
                    </div>
                  </td>
                </tr>
              ) : filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-zinc-400">
                    <ShieldAlert className="w-12 h-12 mx-auto opacity-10 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest leading-none">Tidak ada izin terdaftar</p>
                  </td>
                </tr>
              ) : (
                filteredPermissions.map((permission) => (
                  <tr key={permission.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs border border-primary/5 shadow-sm group-hover:scale-110 transition-all">
                             {permission.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-zinc-800 tracking-tight uppercase">{permission.name}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-bold text-zinc-500">
                             {new Date(permission.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                           </span>
                           <span className="text-[9px] font-black text-zinc-200 uppercase tracking-widest">REGISTRY STAMP</span>
                        </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center justify-center gap-3">
                          <Link 
                            href={`/backend/admin/rbac/permission/${permission.id}`}
                            className="p-2 text-zinc-400 hover:text-primary transition-all hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 shadow-sm active:scale-95"
                          >
                             <Edit className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(permission.id)}
                            className="p-2 text-zinc-400 hover:text-rose-500 transition-all hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 shadow-sm active:scale-95"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#030037]/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
          />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 border border-zinc-100">
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-zinc-800 tracking-tight font-heading uppercase">Registrasi Izin</h3>
                <p className="text-xs font-bold text-zinc-400">Deskripsikan kemampuan baru secara singkat.</p>
              </div>
              
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 underline decoration-primary/30 underline-offset-4">Identity String</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newPermissionName}
                    onChange={(e) => setNewPermissionName(e.target.value)}
                    placeholder="Contoh: create_post"
                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-black text-zinc-950 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-zinc-300 shadow-inner"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-all font-sans"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !newPermissionName.trim()}
                    className="flex-[2] px-8 py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Simpan Izin
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