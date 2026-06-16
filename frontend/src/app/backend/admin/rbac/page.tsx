"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Plus, 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Edit,
  Trash2,
  ShieldAlert,
  Grid3X3,
  List as ListIcon,
  Check,
  X,
  Search,
  CheckCircle2
} from "lucide-react";
import FullPageLoader from "@/components/layout/FullPageLoader";
import SectionLoader from "@/components/layout/SectionLoader";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface Role {
  id: string;
  name: string;
  created_at: string;
  _count?: {
    role_permissions: number;
  };
}

interface Permission {
  id: string;
  name: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

const getRoleStyle = (name: string) => {
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colors = [
    { bg: "bg-blue-100 text-blue-600", border: "border-blue-500" },
    { bg: "bg-purple-100 text-purple-600", border: "border-purple-500" },
    { bg: "bg-emerald-100 text-emerald-600", border: "border-emerald-500" },
    { bg: "bg-orange-100 text-orange-600", border: "border-orange-500" },
    { bg: "bg-rose-100 text-rose-600", border: "border-rose-500" },
  ];
  const style = colors[hash % colors.length];
  const initial = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return { style, initial };
};

export default function RbacPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [mappings, setMappings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "matrix">("list");

  // Modal State
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchPermQuery, setSearchPermQuery] = useState("");

  const fetchRbacData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes, mappingsRes] = await Promise.all([
        fetch("/api/backend/role"),
        fetch("/api/backend/permission"),
        fetch("/api/backend/role-permission")
      ]);

      if (!rolesRes.ok || !permsRes.ok || !mappingsRes.ok) throw new Error("Gagal mengambil data RBAC");

      const [rolesData, permsData, mappingsData] = await Promise.all([
        rolesRes.json(),
        permsRes.json(),
        mappingsRes.json()
      ]);

      setRoles(rolesData);
      setPermissions(permsData);
      
      const mappingSet = new Set<string>(
        mappingsData.map((m: RolePermission) => `${m.role_id}:${m.permission_id}`)
      );
      setMappings(mappingSet);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRbacData();
  }, []);

  const handleToggleMapping = async (roleId: string, permissionId: string) => {
    const key = `${roleId}:${permissionId}`;
    const exists = mappings.has(key);
    
    // Optimistic Update
    const newMappings = new Set(mappings);
    if (exists) newMappings.delete(key);
    else newMappings.add(key);
    setMappings(newMappings);

    try {
      const res = await fetch("/api/backend/role-permission", {
        method: exists ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: roleId, permission_id: permissionId })
      });

      if (!res.ok) throw new Error("Gagal sinkronisasi");
      toast.success(exists ? "Izin dicabut" : "Izin diberikan", { autoClose: 800 });
      
      // Update role counts in our local state
      setRoles(prev => prev.map(r => {
        if (r.id === roleId) {
          return {
            ...r,
            _count: {
              role_permissions: (r._count?.role_permissions || 0) + (exists ? -1 : 1)
            }
          };
        }
        return r;
      }));
    } catch (err: any) {
      toast.error(err.message);
      fetchRbacData(); // Revert
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Hapus peran ini?")) return;
    try {
      const res = await fetch(`/api/backend/role/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Peran dihapus");
      fetchRbacData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const rbacStats = [
    { label: "Total Peran", value: roles.length.toString(), color: "border-blue-500" },
    { label: "Total Izin", value: permissions.length.toString(), color: "border-emerald-500" },
    { label: "Total Pemetaan", value: mappings.size.toString(), color: "border-orange-500" },
    { label: "Status Sistem", value: "SEHAT", color: "bg-emerald-500 text-white" },
  ];

  const filteredPermissionsForModal = permissions.filter(p => 
    p.name.toLowerCase().includes(searchPermQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-full pb-8 animate-in fade-in duration-500">
      {loading && <FullPageLoader />}
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="w-4 h-[2px] bg-primary rounded-full"></div>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Security Architecture</span>
          </div>
          <h1 className="text-3xl font-bold text-[#030037] tracking-tighter leading-none">
            Role <span className="text-primary font-medium">Matrix</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 max-w-xl">
            Kelola pemetaan hak akses antara peran dan kemampuan sistem secara modular.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-100/80 p-1 rounded-lg border border-zinc-200 shadow-sm self-start md:self-auto">
            <button 
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${viewMode === "list" ? 'bg-white text-primary shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                suppressHydrationWarning
            >
                <ListIcon className="w-4 h-4" />
                Daftar Peran
            </button>
            <button 
                onClick={() => setViewMode("matrix")}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${viewMode === "matrix" ? 'bg-white text-primary shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                suppressHydrationWarning
            >
                <Grid3X3 className="w-4 h-4" />
                Matrix Otoritas
            </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {rbacStats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-zinc-100 shadow-lg shadow-zinc-200/10 group hover:scale-[1.03] hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer relative overflow-hidden">
             <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none pt-1">
                  {stat.label}
                </p>
                <div className={`p-2 bg-zinc-50 rounded-lg group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300`}>
                   <ShieldCheck className={`w-4 h-4 text-primary opacity-80 group-hover:opacity-100`} />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-zinc-900 tracking-tighterest group-hover:text-primary transition-colors">{stat.value}</h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-xl shadow-zinc-200/10 overflow-hidden min-h-[500px] relative">
        {loading ? (
             <SectionLoader text="Sinkronisasi Database..." />
        ) : error ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
                <ShieldAlert className="w-16 h-16 text-rose-500 opacity-20" />
                <p className="text-sm font-bold text-rose-500 uppercase tracking-widest">{error}</p>
                <button onClick={fetchRbacData} className="px-6 py-3 bg-zinc-100 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition-all">Coba Segarkan</button>
            </div>
        ) : viewMode === "list" ? (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-zinc-50/50">
                            <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Nama Peran</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Terbuat Pada</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Izin Terpasang</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {roles.map((role) => {
                            const { style, initial } = getRoleStyle(role.name);
                            return (
                                <tr key={role.id} className="group hover:bg-zinc-50/50 transition-colors cursor-pointer" onClick={() => setEditingRole(role)}>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-11 h-11 rounded-lg ${style.bg} flex items-center justify-center font-bold text-sm border border-black/5 transition-transform group-hover:scale-110 shadow-sm`}>
                                                {initial}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-zinc-800 tracking-tight uppercase">{role.name}</p>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Klik untuk Konfigurasi</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-bold text-zinc-500">
                                        {new Date(role.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-lg text-xs font-bold text-zinc-600 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-sm">
                                            {role._count?.role_permissions || 0}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => setEditingRole(role)}
                                                className="p-2 text-zinc-300 hover:text-primary transition-all rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-100 shadow-sm active:scale-95"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteRole(role.id)} className="p-2 text-zinc-300 hover:text-rose-500 transition-all rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-100 shadow-sm active:scale-95">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="overflow-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20 bg-zinc-50/80 backdrop-blur-md shadow-sm">
                        <tr>
                            <th className="p-8 text-[11px] font-bold uppercase tracking-widest text-[#030037] text-left w-72 border-r border-zinc-100/50">Izin \ Peran</th>
                            {roles.map(role => (
                                <th key={role.id} className="p-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500 text-center min-w-[140px] max-w-[180px] truncate">
                                    {role.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {permissions.map((perm) => (
                            <tr key={perm.id} className="group hover:bg-zinc-50/50 transition-colors">
                                <td className="p-8 border-r border-zinc-100/50 sticky left-0 z-10 bg-white group-hover:bg-zinc-50/50 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                    <div className="flex flex-col">
                                        <p className="text-[12px] font-bold text-[#030037] uppercase tracking-tight">{perm.name.replace(/_/g, ' ')}</p>
                                        <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest mt-1">ID: {perm.name}</p>
                                    </div>
                                </td>
                                {roles.map(role => {
                                    const isAssigned = mappings.has(`${role.id}:${perm.id}`);
                                    return (
                                        <td key={`${role.id}:${perm.id}`} className="p-4 text-center">
                                            <button 
                                                onClick={() => handleToggleMapping(role.id, perm.id)}
                                                className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto transition-all transform active:scale-90 border-2 ${
                                                    isAssigned 
                                                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' 
                                                    : 'bg-zinc-50 text-zinc-200 border-transparent hover:border-zinc-200 hover:text-zinc-400 hover:bg-white'
                                                }`}
                                            >
                                                {isAssigned ? <Check className="w-5 h-5" /> : <X className="w-4 h-4 opacity-40" />}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
      
      {/* Legend for Matrix */}
        {viewMode === "matrix" && !loading && (
            <div className="flex items-center gap-6 p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Petunjuk Matrix:</p>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-emerald-500" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase">Izin Aktif</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-zinc-50 border border-zinc-100" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase">Izin Dicabut</span>
                </div>
                <div className="ml-auto flex items-center gap-2 text-zinc-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase italic">Klik pada kotak untuk toggle izin secara instan</span>
                </div>
            </div>
        )}

        {/* PERMISSION MODAL */}
        {editingRole && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div 
                    className="absolute inset-0 bg-[#030037]/50 backdrop-blur-md animate-in fade-in duration-500"
                    onClick={() => setEditingRole(null)}
                />
                <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col border border-white/10">
                    {/* Modal Header */}
                    <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/50">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-[#030037] text-white rounded-xl flex items-center justify-center shadow-xl shadow-[#030037]/20">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-[#030037] tracking-tight uppercase leading-none">{editingRole.name}</h3>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] leading-none">Security Permissions Config</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within/input:text-primary transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Cari izin..."
                                    value={searchPermQuery}
                                    onChange={(e) => setSearchPermQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
                                />
                            </div>
                            <button 
                                onClick={() => setEditingRole(null)}
                                className="p-3 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-800 hover:border-zinc-300 transition-all active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-zinc-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredPermissionsForModal.length === 0 ? (
                                <div className="col-span-full py-24 text-center">
                                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                       <ShieldAlert className="w-10 h-10 text-zinc-300" />
                                    </div>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none">Tidak ada izin ditemukan</p>
                                </div>
                            ) : (
                                filteredPermissionsForModal.map(perm => {
                                    const isAssigned = mappings.has(`${editingRole.id}:${perm.id}`);
                                    return (
                                        <div 
                                            key={perm.id} 
                                            onClick={() => handleToggleMapping(editingRole.id, perm.id)}
                                            className={`p-6 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group h-24 ${
                                                isAssigned 
                                                ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-500/5' 
                                                : 'bg-white border-zinc-100 hover:border-primary/20 hover:shadow-xl hover:shadow-zinc-200/20'
                                            }`}
                                        suppressHydrationWarning
                                        >
                                            <div className="space-y-1">
                                                <p className={`text-sm font-bold tracking-tight uppercase transition-colors ${isAssigned ? 'text-emerald-600' : 'text-zinc-700 group-hover:text-primary'}`}>
                                                    {perm.name.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                                                    KEY: {perm.name}
                                                </p>
                                            </div>
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                                isAssigned 
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-0' 
                                                : 'bg-zinc-50 border border-zinc-100 text-zinc-200 scale-90 -rotate-12 group-hover:rotate-0 group-hover:scale-100 group-hover:bg-primary/10 group-hover:text-primary'
                                            }`}>
                                                <Check className={`w-5 h-5 transition-opacity ${isAssigned ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-8 border-t border-zinc-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                    {roles.find(r => r.id === editingRole.id)?._count?.role_permissions || 0} Izin Terpasang
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setEditingRole(null)}
                            className="w-full sm:w-auto bg-[#030037] text-white px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-zinc-200 hover:bg-black hover:shadow-2xl transition-all flex items-center justify-center gap-3 group active:scale-95"
                        >
                            <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Konfirmasi Perubahan
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}