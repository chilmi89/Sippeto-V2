"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Trash2, Edit3,
  Search, AlertCircle,
  ChevronLeft, ChevronRight,
  X, TriangleAlert,
  CreditCard, ToggleLeft, ToggleRight,
} from "lucide-react";
import FullPageLoader from "@/components/layout/FullPageLoader";
import SectionLoader from "@/components/layout/SectionLoader";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentMethod {
  id: string;
  name: string;
  is_active: boolean;
  profile_id?: string | null;
  created_at?: string;
}

interface PaginatedResponse {
  data: PaymentMethod[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const API       = "/api/backend/payment_kategori";

// ─── Reusable UI ─────────────────────────────────────────────────────────────

const StatusBadge = ({ active }: { active: boolean }) => (
  <span className={[
    "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
    active
      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
      : "bg-zinc-100 text-zinc-400 border border-zinc-200",
  ].join(" ")}>
    {active ? "Aktif" : "Nonaktif"}
  </span>
);

const SkeletonRow = () => (
  <tr>
    <td colSpan={4} className="py-24">
       <SectionLoader text="Sinkronisasi Data..." />
    </td>
  </tr>
);

const EmptyState = () => (
  <tr>
    <td colSpan={4} className="py-20 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-zinc-300" />
        </div>
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
          Tidak ada metode pembayaran ditemukan
        </p>
      </div>
    </td>
  </tr>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({
  page, totalPages, total, pageSize, onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) => {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="bg-white px-4 sm:px-6 py-3.5 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        {total === 0 ? "Tidak ada data" : `Menampilkan ${from}–${to} dari ${total} metode`}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-zinc-300">···</span>
            ) : (
              <button key={p} onClick={() => onPageChange(p as number)}
                className={["w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                  p === page ? "bg-[#030037] text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-100"].join(" ")}>
                {p}
              </button>
            )
          )}
          <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Modal Overlay ────────────────────────────────────────────────────────────

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" aria-modal role="dialog">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full sm:max-w-md z-10">{children}</div>
  </div>
);

// ─── Modal: Tambah / Edit ─────────────────────────────────────────────────────

interface FormModalProps {
  mode: "add" | "edit";
  initial?: PaymentMethod;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentFormModal = ({ mode, initial, onClose, onSuccess }: FormModalProps) => {
  const [name,      setName]      = useState(initial?.name ?? "");
  const [isActive,  setIsActive]  = useState(initial?.is_active ?? true);
  const [isSaving,  setIsSaving]  = useState(false);

  const isEdit  = mode === "edit";
  const isValid = name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSaving(true);
    try {
      const res = isEdit
        ? await fetch(API, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: initial!.id, name: name.trim(), is_active: isActive }),
          })
        : await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), is_active: isActive }), // profile_id null = global
          });

      if (res.ok) {
        toast.success(isEdit ? "Metode pembayaran diperbarui" : "Metode pembayaran ditambahkan");
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? "Terjadi kesalahan");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{isEdit ? "Edit Data" : "Tambah Baru"}</p>
            <h2 className="text-lg font-bold text-[#030037] tracking-tight">{isEdit ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nama */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Nama Metode <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Transfer Bank, QRIS, Tunai"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-[#030037] outline-none focus:ring-2 focus:ring-[#030037]/10 focus:border-zinc-300 transition-all"
              autoFocus
            />
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div>
              <p className="text-sm font-bold text-[#030037]">Status Aktif</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Metode ini akan tersedia untuk digunakan</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className="flex-shrink-0 transition-all"
            >
              {isActive
                ? <ToggleRight className="w-9 h-9 text-emerald-500" />
                : <ToggleLeft className="w-9 h-9 text-zinc-300" />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">
              Batal
            </button>
            <button type="submit" disabled={!isValid || isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#030037] text-white text-sm font-bold disabled:opacity-50 hover:bg-black transition-all">
              {isSaving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Metode"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

// ─── Modal: Konfirmasi Hapus ──────────────────────────────────────────────────

interface DeleteModalProps {
  method: PaymentMethod;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteModal = ({ method, onClose, onSuccess }: DeleteModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${API}?id=${method.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Metode pembayaran berhasil dihapus");
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? "Gagal menghapus");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <TriangleAlert className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Konfirmasi</p>
              <h2 className="text-lg font-bold text-[#030037] tracking-tight">Hapus Metode Pembayaran</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-zinc-500 leading-relaxed">
            Apakah kamu yakin ingin menghapus{" "}
            <span className="font-black text-[#030037]">"{method.name}"</span>?{" "}
            Metode yang masih digunakan pada transaksi tidak dapat dihapus.
          </p>

          <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-zinc-200 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <span className="text-sm font-bold text-[#030037] flex-1">{method.name}</span>
            <StatusBadge active={method.is_active} />
          </div>

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">
              Batal
            </button>
            <button onClick={handleDelete} disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 text-white text-sm font-bold disabled:opacity-50 hover:bg-rose-600 transition-all">
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentMethodPage() {
  // ── Data state
  const [rows,       setRows]       = useState<PaymentMethod[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading,  setIsLoading]  = useState(true);

  // ── Filter / pagination
  const [search,          setSearch]          = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page,            setPage]            = useState(1);

  // ── Modal
  const [addModal,      setAddModal]      = useState(false);
  const [editTarget,    setEditTarget]    = useState<PaymentMethod | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<PaymentMethod | null>(null);

  // ── Debounce search (300ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  };

  // ── Fetch
  const fetchPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(PAGE_SIZE),
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const res = await fetch(`${API}?${params}`);
      if (res.ok) {
        const json: PaginatedResponse = await res.json();
        setRows(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      }
    } catch {
      toast.error("Gagal mengambil data metode pembayaran");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  // ── ESC close modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAddModal(false);
      setEditTarget(null);
      setDeleteTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <>
      {isLoading && <FullPageLoader />}
      <div className="bg-white px-4 sm:px-6 lg:px-8 pt-3 pb-8 space-y-4">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-[#030037] rounded-full" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Master Data Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#030037] tracking-tighter leading-none">
              Metode <span className="text-primary font-medium">Pembayaran</span>
            </h1>
            <p className="text-sm text-zinc-500">
              Kelola metode pembayaran global yang tersedia untuk seluruh ekosistem UMKM SiPetto.
            </p>
          </div>

          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-green-950 shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap w-fit"
          >
            <Plus className="w-4 h-4" /> Tambah Metode
          </button>
        </div>

        {/* Card */}
        <div className="border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="bg-white px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100">
            {/* Info badge */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#030037]/5 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-[#030037]" />
              </div>
              <span className="text-sm font-bold text-[#030037] tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Metode Pembayaran
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-400">
                {total}
              </span>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari nama metode..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-black outline-none focus:ring-2 focus:ring-[#030037]/10 focus:border-zinc-300 transition-all w-full sm:w-56"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[500px] w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[42%]">Nama Metode</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[18%]">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[28%]">Dibuat</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[12%] text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
                  : rows.length > 0
                  ? rows.map((method) => (
                      <tr key={method.id} className="bg-zinc-50 border-b border-zinc-100 hover:bg-white transition-colors">
                        {/* Nama */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-[#030037]/5 flex items-center justify-center flex-shrink-0">
                              <CreditCard className="w-3.5 h-3.5 text-[#030037]/60" />
                            </div>
                            <span className="text-sm font-bold text-[#030037]">{method.name}</span>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-4">
                          <StatusBadge active={method.is_active} />
                        </td>
                        {/* Tanggal */}
                        <td className="px-4 py-4">
                          <span className="text-xs font-medium text-zinc-400">{formatDate(method.created_at)}</span>
                        </td>
                        {/* Aksi */}
                        <td className="px-4 py-4 pr-6">
                          <div className="flex items-center gap-1 justify-end">
                            <button title="Edit" onClick={() => setEditTarget(method)}
                              className="p-1.5 rounded-lg text-zinc-300 hover:text-[#030037] hover:bg-zinc-100 transition-all">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button title="Hapus" onClick={() => setDeleteTarget(method)}
                              className="p-1.5 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : <EmptyState />
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Modals */}
      {addModal && (
        <PaymentFormModal mode="add" onClose={() => setAddModal(false)} onSuccess={fetchPage} />
      )}
      {editTarget && (
        <PaymentFormModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchPage} />
      )}
      {deleteTarget && (
        <DeleteModal method={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={fetchPage} />
      )}
    </>
  );
}