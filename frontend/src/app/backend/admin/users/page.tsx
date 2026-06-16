"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Calendar,
  Users as UsersIcon,
  X,
  ChevronDown,
  Edit2
} from "lucide-react";
import FullPageLoader from "@/components/layout/FullPageLoader";
import SectionLoader from "@/components/layout/SectionLoader";
import { toast } from "react-toastify";

// Type definition berdasarkan Schema Prisma kita
interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
  roles: { id: string, name: string } | null;
}

interface Role {
  id: string;
  name: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    full_name: "",
    email: "",
    password: "",
    phone_number: "",
    role_id: "",
    is_active: true
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/backend/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengambil data");
      setUsers(json.data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/backend/role");
      const json = await res.json();
      if (res.ok) {
        // Karena endpoint /api/backend/role mengembalikan Array langsung 
        setRoles(Array.isArray(json) ? json : (json.data || []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUsers();
    fetchRoles();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ id: "", full_name: "", email: "", password: "", phone_number: "", role_id: "", is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode("edit");
    setFormData({
      id: user.id,
      full_name: user.full_name || "",
      email: user.email,
      password: "", // Jangan tampilkan password lama untuk keamanan
      phone_number: user.phone_number || "",
      role_id: user.roles?.id || "",
      is_active: user.is_active
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = modalMode === "edit";
      const url = isEdit ? `/api/backend/users/${formData.id}` : "/api/backend/users";
      const method = isEdit ? "PUT" : "POST";
      
      const payload: any = { ...formData };
      if (isEdit && !payload.password) {
        delete payload.password; // Hindari mengirim password kosong jika tidak diubah
      }
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan data");
      
      toast.success(json.message || `User berhasil ${isEdit ? "selesai diedit" : "ditambahkan"}`);
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus sistem akses untuk user ${name}?`)) return;

    try {
      const res = await fetch(`/api/backend/users/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus user");
      
      toast.success("User berhasil dihapus");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(term) ||
      (user.full_name && user.full_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-full pb-8 animate-in fade-in duration-500">
      {(loading || submitting) && <FullPageLoader />}
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="w-4 h-[2px] bg-primary rounded-full"></div>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Access Control Management</span>
          </div>
          <h1 className="text-3xl font-bold text-[#030037] tracking-tighter leading-none">
            Manajemen <span className="text-primary font-medium">User</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 max-w-xl">
            Kelola data otoritas, role, dan hak akses staf atau pengguna sistem secara terpusat.
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#030037] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-zinc-200/50 active:scale-95 transition-all group border border-white/5"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Tambah User Baru
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
              placeholder="Cari berdasarkan email atau nama..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Identitas User</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Kontak Info</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Otoritas Role</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24">
                     <SectionLoader text="Sinkronisasi Database..." />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center">
                        <UsersIcon className="w-6 h-6 text-zinc-200" />
                      </div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        Tidak ada data user ditemukan
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm tracking-tight border border-primary/5 uppercase shadow-sm">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-zinc-800 tracking-tight">{user.full_name || "Tanpa Nama"}</p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <Calendar className="w-3 h-3 text-zinc-300" />
                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Join {new Date(user.created_at).toLocaleDateString("id-ID")}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1 text-[11px] font-bold text-zinc-500">
                        <div className="flex items-center gap-1.5 group-hover:text-zinc-800 transition-colors">
                          <Mail className="w-3.5 h-3.5 text-zinc-300" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <Phone className="w-3.5 h-3.5 text-zinc-300" />
                          {user.phone_number || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 text-zinc-600 border border-zinc-100 shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <ShieldCheck className="w-3.5 h-3.5 opacity-70" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{user.roles?.name || "GUEST"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                        <span className={`text-[11px] font-bold tracking-tighter ${user.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2 text-zinc-400 hover:text-primary transition-all hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 shadow-sm active:scale-90"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id, user.full_name || user.email)}
                          className="p-2 text-zinc-400 hover:text-rose-500 transition-all hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 shadow-sm active:scale-90"
                          title="Hapus User"
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

      {/* Modal Form */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div 
            className="absolute inset-0 bg-[#030037]/40 backdrop-blur-md transition-opacity duration-500" 
            onClick={() => !submitting && setIsModalOpen(false)} 
          />
          <div className="relative bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20">
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{modalMode === "add" ? "Registrasi Sistem" : "Update Otoritas"}</span>
                <h3 className="font-bold text-[#030037] text-xl tracking-tight leading-none">
                  {modalMode === "add" ? "Tambah Akun User" : "Edit Parameter Akun"}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => !submitting && setIsModalOpen(false)} 
                className="text-zinc-400 hover:text-rose-500 bg-zinc-50 hover:bg-rose-50 p-2.5 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto flex-1 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Kolom Kiri */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Identitas Lengkap</label>
                      <input 
                        required 
                        type="text" 
                        value={formData.full_name} 
                        onChange={e => setFormData({...formData, full_name: e.target.value})} 
                        placeholder="Nama Lengkap User" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white text-sm font-bold text-[#030037] transition-all" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Kredensial</label>
                      <input 
                        required 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        placeholder="bambang@domain.com" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white text-sm font-bold text-[#030037] transition-all" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Kontak WhatsApp</label>
                      <input 
                        type="tel" 
                        value={formData.phone_number} 
                        onChange={e => setFormData({...formData, phone_number: e.target.value})} 
                        placeholder="0812345678" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white text-sm font-bold text-[#030037] transition-all" 
                      />
                    </div>
                  </div>

                  {/* Kolom Kanan */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Hierarki Role</label>
                      <div className="relative group/select">
                        <select 
                          value={formData.role_id} 
                          onChange={e => setFormData({...formData, role_id: e.target.value})} 
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white text-sm font-bold text-[#030037] appearance-none transition-all cursor-pointer"
                        >
                          <option value="">-- Pilih Role --</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none group-focus-within/select:text-primary transition-colors" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 flex items-center justify-between">
                        Sandi Keamanan
                        {modalMode === "edit" && <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 tracking-tighter uppercase">Opsional jika tetap</span>}
                      </label>
                      <input 
                        required={modalMode === "add"} 
                        type="password" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        placeholder="••••••••" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white text-sm font-bold text-[#030037] transition-all" 
                      />
                    </div>

                    {/* Toggle isActive */}
                    <div className="pt-2">
                      <label className="flex items-center gap-4 cursor-pointer p-4 lg:p-5 rounded-2xl border-2 border-dashed border-zinc-100 bg-zinc-50/30 hover:bg-zinc-50 hover:border-primary/20 transition-all duration-300 group/toggle">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData.is_active} 
                            onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                          />
                          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-[#030037] uppercase tracking-widest">Status Akses Akun</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter opacity-60 group-hover/toggle:opacity-100">Izinkan user masuk ke ekosistem</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 border-t border-zinc-100 flex items-center justify-end gap-3 shrink-0 bg-zinc-50/50">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={submitting}
                  className="px-6 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-[#030037] rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-6 py-2.5 bg-[#030037] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-zinc-200/50 transition-all disabled:opacity-50 flex items-center gap-3 border border-white/5 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Sinkronisasi...
                    </>
                  ) : "Simpan Data User"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UsersPage;