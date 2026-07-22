"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import {
  Plus, Trash2, Edit3,
  Search, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight,
  X, TriangleAlert, Building2, LayoutGrid,
  Tag, Lock, ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  getCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction
} from "@/app/actions/product";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScopeType = "all" | "global" | "tenant";

interface Category {
  id: string;
  name: string;
  profile_id: string | null;
  created_at: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Reusable UI ─────────────────────────────────────────────────────────────

const ScopeBadge = ({ profileId }: { profileId: string | null }) => (
  <span className={[
    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5",
    profileId === null
      ? "bg-blue-50 text-blue-700 border border-blue-100"
      : "bg-emerald-50 text-emerald-700 border border-emerald-100",
  ].join(" ")}>
    {profileId === null ? (
      <>
        <Lock className="w-3 h-3 text-blue-500" /> Pusat (Global)
      </>
    ) : (
      <>
        <Tag className="w-3 h-3 text-emerald-500" /> Lokal (Custom Anda)
      </>
    )}
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
    {Array.from({ length: 4 }).map((_, i) => (
      <td key={i} className="px-6 py-5">
        <div className="h-4 bg-zinc-100 rounded-lg animate-pulse" />
      </td>
    ))}
  </tr>
);

const EmptyState = () => (
  <tr>
    <td colSpan={4} className="py-20 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-zinc-300" />
        </div>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          Tidak ada kategori produk ditemukan
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
  profileOwnerId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryFormModal = ({ mode, initial, profileOwnerId, onClose, onSuccess }: CategoryFormModalProps) => {
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
        : await createCategoryAction({ name: name.trim(), profile_id: profileOwnerId });

      if (res.success) {
        toast.success(isEdit ? "Kategori produk berhasil diperbarui" : "Kategori produk custom berhasil ditambahkan");
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
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{isEdit ? "Edit Data Custom" : "Tambah Kategori Custom"}</p>
            <h2 className="text-lg font-bold text-[#030037] tracking-tight">{isEdit ? "Edit Kategori Produk" : "Kategori Produk Baru"}</h2>
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
              placeholder="Contoh: Paket Bundling Hemat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-[#030037]/10 focus:border-zinc-300 transition-all"
              autoFocus
            />
            <p className="text-[10px] text-zinc-400 italic">
              Kategori custom ini khusus untuk toko Anda dan tidak akan terlihat oleh bisnis lain.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">
              Batal
            </button>
            <button type="submit" disabled={!isValid || isSaving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#030037] text-white text-sm font-bold disabled:opacity-50 hover:bg-black transition-all">
              {isSaving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Kategori"}
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
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Konfirmasi Hapus</p>
              <h2 className="text-lg font-bold text-[#030037] tracking-tight">Hapus Kategori Produk</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-zinc-500 leading-relaxed">
            Apakah Anda yakin ingin menghapus kategori produk custom{" "}
            <span className="font-black text-[#030037]">"{category.name}"</span>?
          </p>

          <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-emerald-400" />
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

export default function TenantProductCategoryPage() {
  const router = useRouter();
  const [rows, setRows]           = useState<Category[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts]       = useState({ all: 0, global: 0, tenant: 0 });
  const [profileOwnerId, setProfileOwnerId] = useState<string | null>(null);
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

  // Ambil profile info UMKM
  useEffect(() => {
    fetch("/api/backend/tenant-umkm")
      .then(res => res.json())
      .then(data => {
        if (data?.profile?.tenant_owner_id || data?.profile?.id) {
          setProfileOwnerId(data.profile.tenant_owner_id || data.profile.id);
        }
      })
      .catch(err => console.error(err));
  }, []);

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
    if (!profileOwnerId) return;
    const otherTab1 = activeTab === "all" ? "global" : "all";
    const otherTab2 = activeTab === "tenant" ? "global" : "tenant";

    startTransition(async () => {
      try {
        const [res, resOther1, resOther2] = await Promise.all([
          getCategoriesAction({ page, limit: PAGE_SIZE, scope: activeTab as "all" | "global" | "tenant", search: debouncedSearch || undefined, profile_id: profileOwnerId }),
          getCategoriesAction({ page: 1, limit: 1, scope: otherTab1 as "all" | "global" | "tenant", profile_id: profileOwnerId }),
          getCategoriesAction({ page: 1, limit: 1, scope: otherTab2 as "all" | "global" | "tenant", profile_id: profileOwnerId }),
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
  }, [page, activeTab, debouncedSearch, profileOwnerId]);

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
              <button onClick={() => router.push("/backend/tenant/products")} className="p-1 -ml-1 text-zinc-400 hover:text-black">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-6 h-1 bg-[#030037] rounded-full" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Katalog Produk UMKM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#030037] tracking-tighter leading-none">
              Kategori <span className="text-primary font-medium">Produk Mandiri</span>
            </h1>
            <p className="text-sm text-zinc-500">
              Kelola kategori produk khusus usaha Anda serta nikmati kategori bawaan global dari pusat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/backend/tenant/products")}
              className="px-4 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all"
            >
              Kembali ke Produk
            </button>
            <button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#030037] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Kategori Custom Baru
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="bg-white px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100">
            <div className="flex items-center gap-2 overflow-x-auto">
              <TabButton label="Semua Kategori" icon={LayoutGrid} iconActiveClass="text-blue-500"
                count={counts.all} isActive={activeTab === "all"}
                onClick={() => handleTabChange("all")} />
              <TabButton label="Global / Pusat" icon={ShieldCheck} iconActiveClass="text-[#3c39d6]"
                count={counts.global} isActive={activeTab === "global"}
                onClick={() => handleTabChange("global")} />
              <TabButton label="Kategori Saya (Custom)" icon={Tag} iconActiveClass="text-emerald-500"
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
                className="pl-10 pr-5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black outline-none focus:ring-2 focus:ring-[#030037]/10 focus:border-zinc-300 transition-all w-full sm:w-56"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[40%]">Nama Kategori</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[25%]">Tipe Akses</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[20%]">Tanggal Dibuat</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-[15%] text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isPending
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
                  : rows.length > 0
                  ? rows.map((cat) => {
                      const isCustomOwn = cat.profile_id !== null && cat.profile_id === profileOwnerId;
                      return (
                        <tr key={cat.id} className="bg-zinc-50 border-b border-zinc-100 hover:bg-white transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.profile_id === null ? "bg-blue-500" : "bg-emerald-500"}`} />
                              <span className="text-sm font-bold text-[#030037]">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <ScopeBadge profileId={cat.profile_id} />
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs font-medium text-zinc-400">{formatDate(cat.created_at)}</span>
                          </td>
                          <td className="px-4 py-4 pr-6">
                            <div className="flex items-center gap-1 justify-end">
                              {isCustomOwn ? (
                                <>
                                  <button title="Edit Kategori Custom" onClick={() => setEditTarget(cat)}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-[#030037] hover:bg-zinc-100 transition-all">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button title="Hapus Kategori Custom" onClick={() => setDeleteTarget(cat)}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-zinc-300 italic flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Bawaan Pusat
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
        <CategoryFormModal mode="add" profileOwnerId={profileOwnerId} onClose={() => setAddModal(false)} onSuccess={fetchPage} />
      )}
      {editTarget && (
        <CategoryFormModal mode="edit" initial={editTarget} profileOwnerId={profileOwnerId} onClose={() => setEditTarget(null)} onSuccess={fetchPage} />
      )}
      {deleteTarget && (
        <DeleteModal category={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={fetchPage} />
      )}
    </>
  );
}
