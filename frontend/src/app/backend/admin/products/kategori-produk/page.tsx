"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import {
  Plus, Trash2, Edit3,
  Search, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight,
  X, TriangleAlert, Building2, LayoutGrid
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction
} from "@/app/actions/product";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScopeType = "all" | "global" | "tenant";

interface Profile {
  business_name: string | null;
  email: string;
}

interface Category {
  id: string;
  name: string;
  profile_id: string | null;
  created_at: string;
  profiles?: Profile | null;
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

const ScopeBadge = ({ profileId }: { profileId: string | null }) => (
  <span className={[
    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
    profileId === null
      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
      : "bg-purple-50 text-purple-600 border border-purple-100",
  ].join(" ")}>
    {profileId === null ? "Global (Pusat)" : "Lokal (Tenant)"}
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
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="px-6 py-5">
        <div className="h-4 bg-zinc-100 rounded-lg animate-pulse" />
      </td>
    ))}
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
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        {total === 0 ? "Tidak ada data" : `Menampilkan ${from}–${to} dari ${total} kategori`}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

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
  const [isSaving, setIsSaving] = useState(false);

  const isEdit  = mode === "edit";
  const isValid = name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSaving(true);
    try {
      const res = isEdit
        ? await updateCategoryAction(initial!.id, name.trim())
        : await createCategoryAction({ name: name.trim(), profile_id: null }); // profile_id null = global

      if (res.success) {
        toast.success(isEdit ? "Kategori produk berhasil diperbarui" : "Kategori produk berhasil ditambahkan");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error ?? "Terjadi kesalahan");
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
            <h2 className="text-lg font-bold text-[#030037] tracking-tight">{isEdit ? "Edit Kategori Produk" : "Tambah Kategori Produk"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Nama Kategori Produk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Makanan Kucing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-[#030037] outline-none focus:ring-2 focus:ring-[#030037]/10 focus:border-zinc-300 transition-all"
              autoFocus
            />
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
      const res = await deleteCategoryAction(category.id);
      if (res.success) {
        toast.success("Kategori produk berhasil dihapus");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error ?? "Gagal menghapus kategori");
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
            Apakah kamu yakin ingin menghapus kategori produk{" "}
            <span className="font-black text-[#030037]">"{category.name}"</span>?{" "}
            Tindakan ini tidak dapat dibatalkan dan produk dengan kategori ini akan disetel menjadi tanpa kategori.
          </p>

          <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${category.profile_id === null ? "bg-emerald-400" : "bg-purple-400"}`} />
            <span className="text-sm font-bold text-[#030037] flex-1">{category.name}</span>
            <ScopeBadge profileId={category.profile_id} />
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
  const [rows, setRows]           = useState<Category[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts]       = useState({ all: 0, global: 0, tenant: 0 });
  const [isPending, startTransition] = useTransition();

  // Filter / pagination state
  const [activeTab, setActiveTab]   = useState<ScopeType>("all");
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage]             = useState(1);

  // Modal state
  const [addModal, setAddModal]       = useState(false);
  const [editTarget, setEditTarget]   = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Debounce search (300ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current  = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  };

  // Fetch paginated data via Server Action
  const fetchPage = useCallback(() => {
    const otherTab1 = activeTab === "all" ? "global" : "all";
    const otherTab2 = activeTab === "tenant" ? "global" : "tenant";

    startTransition(async () => {
      try {
        const [res, resOther1, resOther2] = await Promise.all([
          getCategoriesAction({ page, limit: PAGE_SIZE, scope: activeTab as "all" | "global" | "tenant", search: debouncedSearch || undefined }),
          getCategoriesAction({ page: 1, limit: 1, scope: otherTab1 as "all" | "global" | "tenant" }),
          getCategoriesAction({ page: 1, limit: 1, scope: otherTab2 as "all" | "global" | "tenant" }),
        ]);

        if (res.success && res.data) {
          setRows(res.data as Category[]);
          setTotal(res.total ?? 0);
          setTotalPages(res.totalPages ?? 1);
          setCounts((prev) => ({ ...prev, [activeTab]: res.total ?? 0 }));
        } else if (res.error) {
          toast.error(res.error);
        }

        if (resOther1.success) {
          setCounts((prev) => ({ ...prev, [otherTab1]: resOther1.total ?? 0 }));
        }
        if (resOther2.success) {
          setCounts((prev) => ({ ...prev, [otherTab2]: resOther2.total ?? 0 }));
        }
      } catch {
        toast.error("Gagal mengambil data kategori produk");
      }
    });
  }, [page, activeTab, debouncedSearch]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  // ESC close modals
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

  const handleTabChange = (tab: ScopeType) => {
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
      <div className="bg-white px-4 sm:px-6 lg:px-8 pt-3 pb-8 space-y-4">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-[#030037] rounded-full" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Master Data Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#030037] tracking-tighter leading-none">
              Kategori <span className="text-primary font-medium">Produk</span>
            </h1>
            <p className="text-sm text-zinc-500">
              Kelola parameter pengelompokan produk global pusat maupun produk spesifik tenant UMKM.
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
              <TabButton label="Semua" icon={LayoutGrid} iconActiveClass="text-blue-500"
                count={counts.all} isActive={activeTab === "all"}
                onClick={() => handleTabChange("all")} />
              <TabButton label="Global / Pusat" icon={CheckCircle2} iconActiveClass="text-emerald-400"
                count={counts.global} isActive={activeTab === "global"}
                onClick={() => handleTabChange("global")} />
              <TabButton label="Lokal / Tenant" icon={Building2} iconActiveClass="text-purple-400"
                count={counts.tenant} isActive={activeTab === "tenant"}
                onClick={() => handleTabChange("tenant")} />
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
                  <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[35%]">Nama Kategori</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[20%]">Tipe Akses</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[25%]">Dibuat Oleh</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[10%]">Tanggal Dibuat</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[10%] text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isPending
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
                  : rows.length > 0
                  ? rows.map((cat) => (
                      <tr key={cat.id} className="bg-zinc-50 border-b border-zinc-100 hover:bg-white transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.profile_id === null ? "bg-emerald-400" : "bg-purple-400"}`} />
                            <span className="text-sm font-bold text-[#030037]">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4"><ScopeBadge profileId={cat.profile_id} /></td>
                        <td className="px-4 py-4">
                          {cat.profile_id === null ? (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span className="text-[10px] font-bold text-zinc-400 uppercase">Sistem Pusat</span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5 max-w-[200px]">
                              <span className="text-xs font-bold text-[#030037] truncate" title={cat.profiles?.business_name || "Tanpa Nama Bisnis"}>
                                {cat.profiles?.business_name || "Tenant Tanpa Nama"}
                              </span>
                              <span className="text-[9px] text-zinc-400 truncate" title={cat.profiles?.email}>
                                {cat.profiles?.email}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-medium text-zinc-400">{formatDate(cat.created_at)}</span>
                        </td>
                        <td className="px-4 py-4 pr-6">
                          <div className="flex items-center gap-1 justify-end">
                            {/* Hanya kategori global (milik admin) yang bisa diedit/hapus oleh admin, atau jika admin berhak mengedit kategori tenant, tampilkan secara kondisional */}
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
