"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  ArrowLeft,
  Save,
  ChevronRight,
  ShieldAlert,
  Trash2,
  Calendar
} from "lucide-react";
import FullPageLoader from "@/components/layout/FullPageLoader";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface Permission {
  id: string;
  name: string;
  created_at: string;
}

export default function PermissionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [permissionName, setPermissionName] = useState("");

  useEffect(() => {
    const fetchPermission = async () => {
      try {
        const response = await fetch(`/api/backend/permission/${id}`);
        if (!response.ok) throw new Error("Izin tidak ditemukan");
        const data = await response.json();
        setPermission(data);
        setPermissionName(data.name);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPermission();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionName.trim()) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/backend/permission/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: permissionName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal memperbarui izin");
      }
      
      const updated = await response.json();
      setPermission(updated);
      toast.success("Izin berhasil diperbarui!");
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui izin");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus izin ini? Tindakan ini akan berpengaruh pada semua peran yang menggunakannya.")) return;

    try {
      const response = await fetch(`/api/backend/permission/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Gagal menghapus izin");
      
      toast.success("Izin berhasil dihapus");
      router.push("/backend/admin/rbac/permission");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus izin");
    }
  };

  if (loading) return <FullPageLoader />;

  if (error || !permission) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6 text-rose-500 font-sans">
        <ShieldAlert className="w-12 h-12 opacity-30" />
        <div className="text-center space-y-1">
          <p className="text-xl font-bold uppercase tracking-widest leading-none">{error || "Data Tidak Ditemukan"}</p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gagal memverifikasi identitas izin sistem</p>
        </div>
        <Link href="/backend/admin/rbac/permission" className="px-10 py-4 bg-zinc-900 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-black transition-all shadow-xl active:scale-95">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-full pb-8 animate-in fade-in duration-500">
      
      {/* Breadcrumbs Section */}
      <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-1">
        <Link href="/backend/admin/rbac/permission" className="hover:text-primary transition-all flex items-center gap-2 group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Daftar Izin
        </Link>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="text-zinc-500">Detail Otoritas</span>
      </div>

      <div className="flex flex-col gap-8 max-w-3xl">
        {/* Simplified Main Card */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-xl shadow-zinc-200/10 overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 transition-all group-hover:bg-primary/10" />
           
           <div className="p-10 space-y-10">
              {/* Identity Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-xl bg-[#030037] flex items-center justify-center font-bold text-xl tracking-tighter text-white shadow-xl shadow-[#030037]/20 border border-white/10 transition-transform group-hover:scale-105">
                       {permission.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                       <h1 className="text-3xl font-bold text-[#030037] tracking-tighter uppercase leading-none">{permission.name}</h1>
                       <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-400 rounded text-[9px] font-bold uppercase tracking-widest leading-none">IDENTITY KEY</span>
                          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">UID: {permission.id.split('-')[0]}...</span>
                       </div>
                    </div>
                 </div>
                 
                 <button 
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[10px] font-bold transition-all shadow-sm active:scale-95 border border-rose-100 uppercase tracking-widest"
                 >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                 </button>
              </div>

              {/* Form Section */}
              <div className="pt-10 border-t border-zinc-50 space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Modifikasi Otoritas</h3>
                 </div>
 
                 <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Identity Identifier</label>
                       <input 
                         type="text" 
                         value={permissionName}
                         onChange={(e) => setPermissionName(e.target.value)}
                         className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-950 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm placeholder:text-zinc-300"
                         placeholder="Contoh: create_post"
                         suppressHydrationWarning
                       />
                       <p className="text-[10px] font-medium text-zinc-400 flex items-center gap-2 italic">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 opacity-60" />
                          Label unik untuk pemetaan hak akses granular pada matrix sistem.
                       </p>
                    </div>
 
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
                       <div className="p-5 bg-zinc-50/50 rounded-xl border border-zinc-100 space-y-1.5">
                          <div className="flex items-center gap-2 text-zinc-400">
                             <Calendar className="w-3.5 h-3.5" />
                             <span className="text-[9px] font-bold uppercase tracking-widest">Registry Date</span>
                          </div>
                          <p className="text-[11px] font-bold text-zinc-600">
                             {new Date(permission.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                       </div>
                       
                       <div className="p-5 bg-zinc-50/50 rounded-xl border border-zinc-100 space-y-1.5">
                          <div className="flex items-center gap-2 text-zinc-400">
                             <ShieldCheck className="w-3.5 h-3.5" />
                             <span className="text-[9px] font-bold uppercase tracking-widest">System Status</span>
                          </div>
                          <p className="text-[11px] font-bold text-emerald-500 uppercase italic">Verifikasi Aktif</p>
                       </div>
                    </div>
 
                    <div className="pt-8 border-t border-zinc-50 flex items-center justify-end">
                          <button 
                            type="submit"
                            disabled={isUpdating || !permissionName.trim() || permissionName === (permission?.name ?? '')}
                            className="flex items-center justify-center gap-3 px-10 py-3.5 bg-[#030037] text-white rounded-xl text-[10px] font-bold transition-all shadow-xl shadow-zinc-200 hover:bg-black disabled:opacity-50 disabled:shadow-none uppercase tracking-widest active:scale-95 group"
                          >
                            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {isUpdating ? "Memproses..." : "Perbarui Izin"}
                          </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}