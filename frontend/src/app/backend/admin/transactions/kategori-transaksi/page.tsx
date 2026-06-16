"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Trash2, Edit3,
  ArrowUpRight, ArrowDownLeft,
  Search, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight,
  X, TriangleAlert,
} from "lucide-react";
import FullPageLoader from "@/components/layout/FullPageLoader";
import SectionLoader from "@/components/layout/SectionLoader";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = "pemasukan" | "pengeluaran";

interface Category {
  id: string;
  name: string;
  type: TabType;
  updatedAt?: string;
}

interface PaginatedResponse {
  data: Category[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Reusable UI ─────────────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: TabType }) => (
  <span className={[
    "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
    type === "pemasukan"
      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
      : "bg-rose-50 text-rose-600 border border-rose-100",
  ].join(" ")}>
    {type}
  </span>
);

const TabButton = ({
  label, icon: Icon, iconActiveClass, count, isActive, onClick,
}: {
  label: string;
  icon: React.ElementType;
  iconActiveClass: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={[
      "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all",
      isActive
        ? "bg-[#030037] text-white shadow-lg shadow-[#030037]/20"
        : "text-zinc-500 hover:bg-zinc-100",
    ].join(" ")}
  >
    <Icon className={`w-4 h-4 ${isActive ? iconActiveClass : "text-zinc-300"}`} />
    {label}
    <span className={[
      "text-[9px] font-bold px-2 py-0.5 rounded-lg",
      isActive ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-400",
    ].join(" ")}>
      {count}
    </span>
  </button>
);

const SkeletonRow = () => (
  <tr>
    <td colSpan={5} className="py-24">
       <SectionLoader text="Sinkronisasi Data..." />
    </td>
  </tr>
);

const EmptyState = () => (
  <tr>
    <td colSpan={5} className="py-20 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-zinc-300" />
        </div>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          Tidak ada kategori ditemukan
        </p>
      </div>
    </td>
  </tr>
);

// ─── Pagination Controls ──────────────────────────────────────────────────────

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

  // Build page number list with ellipsis
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="bg-white px-4 sm:px-6 py-3.5 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Info */}
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        {total === 0 ? "Tidak ada data" : `Menampilkan ${from}–${to} dari ${total} kategori`}
      </p>

      {/* Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Prev */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-zinc-300">
                ···
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={[
                  "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                  p === page
                    ? "bg-[#030037] text-white shadow-sm"
                    : "text-zinc-500 hover:bg-zinc-100",
                ].join(" ")}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
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

interface CategoryFormModalProps {
  mode: "add" | "edit";
  initial?: Category;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryFormModal = ({ mode, initial, onClose, onSuccess }: CategoryFormModalProps) => {
  const [name, setName]       = useState(initial?.name ?? "");
  const [type, setType]       = useState<TabType>(initial?.type ?? "pemasukan");
  const [isSaving, setIsSaving] = useState(false);

  const isEdit  = mode === "edit";
  const isValid = name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSaving(true);
    try {
      const res = isEdit
        ? await fetch("/api/backend/kategori", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: initial!.id, name: name.trim(), type }),
          })
        : await fetch("/api/backend/kategori", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), type }), // profile_id null = global
          });

      if (res.ok) {
        toast.success(isEdit ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan");
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
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{isEdit ? "Edit Data" : "Tambah Baru"}</p>
            <h2 className="text-lg font-bold text-[#030037] tracking-tight">{isEdit ? "Edit Kategori" : "Tambah Kategori"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Penjualan Produk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-[#030037] outline-none focus:ring-2 focus:ring-[#030037]/10 focus:border-zinc-300 transition-all"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Tipe Kategori <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["pemasukan", "pengeluaran"] as TabType[]).map((t) => (
                <button
                  key={t} type="button" onClick={() => setType(t)}
                  className={[
                    "flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold uppercase tracking-tight transition-all",
                    type === t
                      ? t === "pemasukan" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300",
                  ].join(" ")}
                >
                  {t === "pemasukan" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">
              Batal
            </button>
            <button type="submit" disabled={!isValid || isSaving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#030037] text-white text-sm font-bold disabled:opacity-50 hover:bg-black transition-all">
              {isSaving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Kategori"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

// ─── Modal: Konfirmasi Hapus ──────────────────────────────────────────────────

interface DeleteModalProps {
  category: Category;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteModal = ({ category, onClose, onSuccess }: DeleteModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/backend/kategori?id=${category.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Kategori berhasil dihapus");
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? "Gagal menghapus kategori");
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
              <h2 className="text-lg font-bold text-[#030037] tracking-tight">Hapus Kategori</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-zinc-500 leading-relaxed">
            Apakah kamu yakin ingin menghapus kategori{" "}
            <span className="font-black text-[#030037]">"{category.name}"</span>?{" "}
            Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${category.type === "pemasukan" ? "bg-emerald-400" : "bg-rose-400"}`} />
            <span className="text-sm font-bold text-[#030037] flex-1">{category.name}</span>
            <TypeBadge type={category.type} />
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-black text-zinc-500 hover:bg-zinc-50 transition-all">
              Batal
            </button>
            <button onClick={handleDelete} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 text-white text-sm font-black disabled:opacity-50 hover:bg-rose-600 transition-all">
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CategoryManagementPage() {
  // ── Data state
  const [rows, setRows]           = useState<Category[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts]       = useState({ pemasukan: 0, pengeluaran: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // ── Filter / pagination state
  const [activeTab, setActiveTab]   = useState<TabType>("pemasukan");
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage]             = useState(1);

  // ── Modal state
  const [addModal, setAddModal]       = useState(false);
  const [editTarget, setEditTarget]   = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // ── Debounce search (300ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current  = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1); // reset ke halaman 1 saat search berubah
    }, 300);
  };

  // ── Fetch paginated data
  const fetchPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page:   String(page),
        limit:  String(PAGE_SIZE),
        type:   activeTab,
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      // Fetch data tab aktif + count tab lainnya secara paralel
      const otherTab = activeTab === "pemasukan" ? "pengeluaran" : "pemasukan";
      const [res, resOther] = await Promise.all([
        fetch(`/api/backend/kategori?${params}`),
        fetch(`/api/backend/kategori?page=1&limit=1&type=${otherTab}`),
      ]);

      if (res.ok) {
        const json: PaginatedResponse = await res.json();
        setRows(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
        setCounts((prev) => ({ ...prev, [activeTab]: json.total }));
      }

      if (resOther.ok) {
        const j: PaginatedResponse = await resOther.json();
        setCounts((prev) => ({ ...prev, [otherTab]: j.total }));
      }
    } catch {
      toast.error("Gagal mengambil data kategori");
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab, debouncedSearch]);

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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
  };

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
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Master Data Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#030037] tracking-tighter leading-none">
              Kategori <span className="text-primary font-medium">Transaksi</span>
            </h1>
            <p className="text-sm text-zinc-500">
              Kelola parameter klasifikasi keuangan global untuk seluruh ekosistem UMKM SiPetto.
            </p>
          </div>

          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-green-950 shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap w-fit"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        </div>

        {/* Card */}
        <div className="border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="bg-white px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100">
            <div className="flex items-center gap-2 overflow-x-auto">
              <TabButton label="Pemasukan" icon={ArrowUpRight} iconActiveClass="text-emerald-400"
                count={counts.pemasukan} isActive={activeTab === "pemasukan"}
                onClick={() => handleTabChange("pemasukan")} />
              <TabButton label="Pengeluaran" icon={ArrowDownLeft} iconActiveClass="text-rose-400"
                count={counts.pengeluaran} isActive={activeTab === "pengeluaran"}
                onClick={() => handleTabChange("pengeluaran")} />
            </div>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari nama kategori..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-black outline-none focus:ring-2 focus:ring-[#030037]/10 focus:border-zinc-300 transition-all w-full sm:w-56"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[36%]">Nama Kategori</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[16%]">Tipe</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[16%]">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[22%]">Terakhir Diupdate</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[10%] text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
                  : rows.length > 0
                  ? rows.map((cat) => (
                      <tr key={cat.id} className="bg-zinc-50 border-b border-zinc-100 hover:bg-white transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.type === "pemasukan" ? "bg-emerald-400" : "bg-rose-400"}`} />
                            <span className="text-sm font-bold text-[#030037]">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4"><TypeBadge type={cat.type} /></td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-zinc-400">Global</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-medium text-zinc-400">{formatDate(cat.updatedAt)}</span>
                        </td>
                        <td className="px-4 py-4 pr-6">
                          <div className="flex items-center gap-1 justify-end">
                            <button title="Edit" onClick={() => setEditTarget(cat)}
                              className="p-1.5 rounded-lg text-zinc-300 hover:text-[#030037] hover:bg-zinc-100 transition-all">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button title="Hapus" onClick={() => setDeleteTarget(cat)}
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

          {/* Pagination Footer */}
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
        <CategoryFormModal mode="add" onClose={() => setAddModal(false)} onSuccess={fetchPage} />
      )}
      {editTarget && (
        <CategoryFormModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchPage} />
      )}
      {deleteTarget && (
        <DeleteModal category={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={fetchPage} />
      )}
    </>
  );
}