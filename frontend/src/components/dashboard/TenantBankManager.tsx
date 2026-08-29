"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Check,
  Star,
  Building2,
  Copy,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getTenantBanksAction,
  createTenantBankAction,
  updateTenantBankAction,
  deleteTenantBankAction,
  setPrimaryTenantBankAction,
} from "@/app/actions/tenant-bank";

interface BankAccount {
  id: string;
  profile_id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
}

const BANK_OPTIONS = [
  { name: "Bank BCA", code: "BCA", gradient: "from-[#00529C] via-[#003875] to-[#001D4A]" },
  { name: "Bank Mandiri", code: "MANDIRI", gradient: "from-[#003D79] via-[#002855] to-[#E5A823]" },
  { name: "Bank BRI", code: "BRI", gradient: "from-[#00529C] via-[#003366] to-[#00A859]" },
  { name: "Bank BNI", code: "BNI", gradient: "from-[#F15A24] via-[#D14412] to-[#005B5C]" },
  { name: "Bank Syariah Indonesia (BSI)", code: "BSI", gradient: "from-[#00A39D] via-[#00807B] to-[#E0A838]" },
  { name: "Bank CIMB Niaga", code: "CIMB", gradient: "from-[#7F1416] via-[#5C0E10] to-[#2B0607]" },
  { name: "Bank Permata", code: "PERMATA", gradient: "from-[#008638] via-[#00662B] to-[#00471E]" },
  { name: "Bank Danamon", code: "DANAMON", gradient: "from-[#E30613] via-[#B3000B] to-[#660006]" },
  { name: "Lainnya (Isi Manual)", code: "OTHER", gradient: "from-slate-800 via-slate-900 to-zinc-950" },
];

export default function TenantBankManager({ profileId }: { profileId: string }) {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bank_name: "Bank BCA",
    custom_bank: "",
    account_number: "",
    account_name: "",
    is_primary: false,
  });

  const loadBanks = async () => {
    setLoading(true);
    const res = await getTenantBanksAction(profileId);
    if (res.success) {
      setBanks(res.data);
    } else {
      toast.error(res.error || "Gagal memuat rekening bank.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profileId) loadBanks();
  }, [profileId]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      bank_name: "Bank BCA",
      custom_bank: "",
      account_number: "",
      account_name: "",
      is_primary: banks.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (bank: BankAccount) => {
    setEditingId(bank.id);
    const isPreset = BANK_OPTIONS.some((b) => b.name === bank.bank_name);
    setFormData({
      bank_name: isPreset ? bank.bank_name : "Lainnya (Isi Manual)",
      custom_bank: isPreset ? "" : bank.bank_name,
      account_number: bank.account_number,
      account_name: bank.account_name,
      is_primary: bank.is_primary,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBankName =
      formData.bank_name === "Lainnya (Isi Manual)"
        ? formData.custom_bank.trim()
        : formData.bank_name;

    if (!finalBankName) return toast.warning("Nama bank wajib diisi.");
    if (!formData.account_number.trim()) return toast.warning("Nomor rekening wajib diisi.");
    if (!formData.account_name.trim()) return toast.warning("Nama pemilik rekening wajib diisi.");

    if (editingId) {
      const res = await updateTenantBankAction(editingId, {
        bank_name: finalBankName,
        account_number: formData.account_number.trim(),
        account_name: formData.account_name.trim(),
        is_primary: formData.is_primary,
      });
      if (res.success) {
        toast.success("Rekening bank berhasil diperbarui!");
        setIsModalOpen(false);
        loadBanks();
      } else {
        toast.error(res.error || "Gagal memperbarui rekening bank.");
      }
    } else {
      const res = await createTenantBankAction({
        profile_id: profileId,
        bank_name: finalBankName,
        account_number: formData.account_number.trim(),
        account_name: formData.account_name.trim(),
        is_primary: formData.is_primary,
      });
      if (res.success) {
        toast.success("Rekening bank berhasil ditambahkan!");
        setIsModalOpen(false);
        loadBanks();
      } else {
        toast.error(res.error || "Gagal menambahkan rekening bank.");
      }
    }
  };

  const handleDelete = async (id: string, bankName: string) => {
    if (!confirm(`Hapus rekening ${bankName}?`)) return;
    const res = await deleteTenantBankAction(id);
    if (res.success) {
      toast.success("Rekening bank berhasil dihapus.");
      loadBanks();
    } else {
      toast.error(res.error || "Gagal menghapus rekening bank.");
    }
  };

  const handleSetPrimary = async (id: string) => {
    const res = await setPrimaryTenantBankAction(id);
    if (res.success) {
      toast.success("Rekening utama berhasil diperbarui!");
      loadBanks();
    } else {
      toast.error(res.error || "Gagal mengatur rekening utama.");
    }
  };

  const handleCopyNumber = (accNumber: string, id: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getBankGradient = (bankName: string) => {
    const found = BANK_OPTIONS.find((b) => b.name === bankName);
    return found ? found.gradient : "from-slate-800 via-slate-900 to-zinc-950";
  };

  const formatCardNumber = (num: string) => {
    const clean = num.replace(/\D/g, "");
    return clean.replace(/(.{4})/g, "$1 ").trim() || num;
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest mb-1">
            <Building2 className="w-4 h-4 text-emerald-500" /> Rekening Pembayaran E-Catalog
          </div>
          <h2 className="text-lg font-black text-[#030037] tracking-tight">Manajemen Rekening Bank</h2>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Tambahkan rekening bank resmi toko Anda. Rekening ini akan tampil saat pelanggan memilih metode Transfer Bank & pesan WhatsApp.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#030037] hover:bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Rekening Bank</span>
        </button>
      </div>

      {/* Grid Display Kartu Bank Digital 3D */}
      {loading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-zinc-100 shadow-sm text-xs font-bold text-zinc-400">
          Memuat data rekening bank...
        </div>
      ) : banks.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center gap-3 bg-white rounded-2xl border border-dashed border-zinc-250 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#030037]">Belum ada rekening bank</h3>
            <p className="text-xs text-zinc-400 font-medium max-w-sm mt-1">
              Tambahkan minimal 1 rekening bank toko Anda agar pelanggan dapat melakukan transfer pembayaran E-Catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors"
          >
            + Tambah Rekening Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banks.map((bank) => {
            const gradient = getBankGradient(bank.bank_name);
            return (
              <div
                key={bank.id}
                className={`relative rounded-3xl p-6 bg-gradient-to-br ${gradient} text-white shadow-xl overflow-hidden border border-white/10 flex flex-col justify-between h-[210px] group transition-all duration-300 hover:scale-[1.02]`}
              >
                {/* Background Glow Overlay */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                {/* Card Top: Bank Name & Primary Badge */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-white/80" />
                    <span className="text-sm font-black tracking-wider uppercase font-sans">
                      {bank.bank_name}
                    </span>
                  </div>
                  {bank.is_primary ? (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full backdrop-blur-xs">
                      <Star className="w-3 h-3 fill-emerald-300 text-emerald-300" /> Rekening Utama
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(bank.id)}
                      className="text-[9px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white/80 border border-white/10 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                    >
                      Jadikan Utama
                    </button>
                  )}
                </div>

                {/* Card Middle: Gold Chip & Formatted Account Number */}
                <div className="space-y-2 relative z-10 my-auto">
                  <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 to-yellow-200 border border-amber-500/40 shadow-inner flex items-center justify-center">
                    <div className="w-6 h-4 border-t border-b border-amber-600/40" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-black tracking-widest text-white drop-shadow-xs">
                      {formatCardNumber(bank.account_number)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(bank.account_number, bank.id)}
                      className="p-1.5 bg-white/15 hover:bg-white/30 rounded-lg transition-colors cursor-pointer"
                      title="Salin Nomor Rekening"
                    >
                      {copiedId === bank.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Bottom: Account Holder Name & Actions */}
                <div className="flex items-end justify-between relative z-10 border-t border-white/10 pt-2.5">
                  <div className="min-w-0 pr-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/60 font-bold block">
                      ATAS NAMA (PEMILIK)
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-white truncate block">
                      {bank.account_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(bank)}
                      className="p-1.5 bg-white/15 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Rekening"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(bank.id, bank.bank_name)}
                      className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Rekening"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Form Tambah/Edit Rekening */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-[#030037] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-xl">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold">
                  {editingId ? "Edit Rekening Bank" : "Tambah Rekening Bank"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Kategori Bank Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-black">
                  Kategori Bank <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-primary transition-all"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                >
                  {BANK_OPTIONS.map((b) => (
                    <option key={b.name} value={b.name} className="text-black">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Kustom jika Pilih Lainnya */}
              {formData.bank_name === "Lainnya (Isi Manual)" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black">
                    Nama Bank Kustom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bank Nagari, Neo Commerce, Seabank"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-primary transition-all"
                    value={formData.custom_bank}
                    onChange={(e) => setFormData({ ...formData, custom_bank: e.target.value })}
                  />
                </div>
              )}

              {/* Nomor Rekening */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-black">
                  Nomor Rekening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 8835 1234 5678"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:border-primary transition-all"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                />
              </div>

              {/* Nama Pemilik / Atas Nama */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-black">
                  Atas Nama (Nama Pemilik) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ACHMAD CHILMI / TOKO MAKMUR JAYA"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black uppercase focus:outline-none focus:border-primary transition-all"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                />
              </div>

              {/* Toggle Primary */}
              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                />
                <span className="text-xs font-bold text-black">
                  Jadikan Rekening Utama (Default Transfer)
                </span>
              </label>

              {/* Action Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#030037] hover:bg-primary text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingId ? "Simpan Perubahan" : "Tambah Rekening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
