"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import {
  Plus, Trash2, Edit3, Search, AlertCircle, ChevronLeft, ChevronRight,
  X, TriangleAlert, Percent, Banknote, Tag, Ticket, Calendar, ToggleLeft, ToggleRight, Package
} from "lucide-react";
import { toast } from "react-toastify";
import { getProductsAction } from "@/app/actions/product";
import {
  getDiscountsAction,
  createDiscountAction,
  updateDiscountAction,
  deleteDiscountAction,
  getDiscountProductsAction,
  toggleDiscountProductAction,
} from "@/app/actions/discount";

interface DiscountItem {
  id: string;
  profile_id: string;
  code: string | null;
  name: string;
  type: string; // PERCENTAGE / FIXED_AMOUNT
  value: number;
  min_purchase: number;
  max_discount: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

const PAGE_SIZE = 10;

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function DateRangePicker({
  startDate,
  endDate,
  onSelectRange,
}: {
  startDate: string;
  endDate: string;
  onSelectRange: (start: string, end: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplay = () => {
    if (!startDate && !endDate) return "Pilih Rentang Tanggal & Jam Promo (WIB)...";
    const formatFull = (dateStr: string) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dateFormatted = d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta"
      });
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${dateFormatted}, ${hours}:${minutes} WIB`;
    };

    const startFormatted = startDate ? formatFull(startDate) : "Mulai Sekarang";
    const endFormatted = endDate ? formatFull(endDate) : "Tanpa Expired";
    return `${startFormatted}   ➔   ${endFormatted}`;
  };

  const getInitialTime = (dateStr: string, defaultTime: string) => {
    if (!dateStr) return defaultTime;
    const parts = dateStr.split("T");
    if (parts.length > 1 && parts[1]) {
      return parts[1].substring(0, 5);
    }
    return defaultTime;
  };

  const startTime = getInitialTime(startDate, "00:00");
  const endTime = getInitialTime(endDate, "23:59");

  const handleStartTimeChange = (newTime: string) => {
    const datePart = startDate ? startDate.split("T")[0] : new Date().toISOString().split("T")[0];
    onSelectRange(`${datePart}T${newTime}`, endDate);
  };

  const handleEndTimeChange = (newTime: string) => {
    const datePart = endDate ? endDate.split("T")[0] : (startDate ? startDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    onSelectRange(startDate || `${datePart}T00:00`, `${datePart}T${newTime}`);
  };

  const applyPreset = (days: number | null) => {
    if (days === null) {
      onSelectRange("", "");
      setIsOpen(false);
      return;
    }
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const startStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00`;
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T23:59`;
    onSelectRange(startStr, endStr);
    setIsOpen(false);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const handleDateClick = (dayNum: number) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;

    if (!startDate || (startDate && endDate)) {
      onSelectRange(`${dateStr}T${startTime}`, "");
    } else {
      const startD = new Date(startDate.split("T")[0]);
      const clickD = new Date(dateStr);
      if (clickD < startD) {
        onSelectRange(`${dateStr}T${startTime}`, "");
      } else {
        onSelectRange(startDate, `${dateStr}T${endTime}`);
      }
    }
  };

  const isSameDay = (d1Str: string, y: number, m: number, d: number) => {
    if (!d1Str) return false;
    const dateObj = new Date(d1Str);
    return dateObj.getFullYear() === y && dateObj.getMonth() === m && dateObj.getDate() === d;
  };

  const isInRange = (y: number, m: number, d: number) => {
    if (!startDate || !endDate) return false;
    const curTime = new Date(y, m, d).getTime();
    const startTime = new Date(startDate.split("T")[0]).getTime();
    const endTime = new Date(endDate.split("T")[0]).getTime();

    if (startTime && endTime) {
      const min = Math.min(startTime, endTime);
      const max = Math.max(startTime, endTime);
      return curTime >= min && curTime <= max;
    }
    return false;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#3c39d6]" /> Masa Berlaku Promo
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => applyPreset(7)}
            className="px-2 py-0.5 bg-zinc-100 hover:bg-[#3c39d6] hover:text-white rounded-md text-[10px] font-bold text-zinc-700 transition-colors cursor-pointer"
          >
            +7 Hari
          </button>
          <button
            type="button"
            onClick={() => applyPreset(30)}
            className="px-2 py-0.5 bg-zinc-100 hover:bg-[#3c39d6] hover:text-white rounded-md text-[10px] font-bold text-zinc-700 transition-colors cursor-pointer"
          >
            +30 Hari
          </button>
          <button
            type="button"
            onClick={() => applyPreset(null)}
            className="px-2 py-0.5 bg-zinc-100 hover:bg-emerald-600 hover:text-white rounded-md text-[10px] font-bold text-zinc-700 transition-colors cursor-pointer"
          >
            Selamanya
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-zinc-300 hover:border-[#3c39d6] rounded-xl text-xs font-mono font-bold text-black outline-none shadow-2xs transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#3c39d6] shrink-0" />
          <span className={!startDate && !endDate ? "text-zinc-400 font-sans text-xs font-normal" : "text-black"}>
            {formatDisplay()}
          </span>
        </div>
        <span className="text-[10px] bg-purple-50 text-[#3c39d6] px-2 py-0.5 rounded-md font-sans font-bold">
          {isOpen ? "Tutup Kalender" : "Pilih Kalender"}
        </span>
      </button>

      {/* ULTRA-SMOOTH LIGHTWEIGHT MODAL POPUP */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 w-full max-w-sm p-4.5 space-y-3.5">
            {/* Modal Title & Close Button */}
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Kalender Periode</p>
                <h3 className="text-sm font-bold text-[#030037]">Pilih Masa Berlaku Promo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets inside Modal */}
            <div className="flex items-center justify-between bg-zinc-50 p-2 rounded-xl border border-zinc-200/80">
              <span className="text-[10px] font-black text-zinc-400 uppercase">Pintasan Cepat:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyPreset(7)}
                  className="px-2 py-1 bg-white border border-zinc-200 hover:bg-[#3c39d6] hover:text-white rounded-lg text-[10px] font-bold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                >
                  +7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(30)}
                  className="px-2 py-1 bg-white border border-zinc-200 hover:bg-[#3c39d6] hover:text-white rounded-lg text-[10px] font-bold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                >
                  +30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(null)}
                  className="px-2 py-1 bg-white border border-zinc-200 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                >
                  Selamanya
                </button>
              </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between px-1 py-1">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-[#030037]">
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days Grid Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
                <span key={d} className="text-[10px] font-bold text-zinc-400 uppercase">
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid Body */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isStart = isSameDay(startDate, year, month, dayNum);
                const isEnd = isSameDay(endDate, year, month, dayNum);
                const inRange = isInRange(year, month, dayNum);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleDateClick(dayNum)}
                    className={`h-9 w-9 mx-auto rounded-xl text-xs font-bold transition-colors flex items-center justify-center cursor-pointer ${
                      isStart || isEnd
                        ? "bg-[#3c39d6] text-white shadow-md font-bold"
                        : inRange
                        ? "bg-[#3c39d6]/15 text-[#3c39d6] font-bold"
                        : "hover:bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Time Settings Section */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-50 border border-zinc-200/80 p-2 rounded-xl">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">⏰ Jam Mulai (WIB)</label>
                <select
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono font-bold text-black outline-none focus:border-[#3c39d6] cursor-pointer"
                >
                  {Array.from({ length: 24 }).flatMap((_, i) => {
                    const pad = (n: number) => n.toString().padStart(2, "0");
                    const h = pad(i);
                    return [`${h}:00`, `${h}:15`, `${h}:30`, `${h}:45`].map((t) => (
                      <option key={t} value={t}>
                        {t} WIB
                      </option>
                    ));
                  })}
                  <option value="23:59">23:59 WIB</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-rose-500 uppercase tracking-wider block">⏰ Jam Expired (WIB)</label>
                <select
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono font-bold text-black outline-none focus:border-[#3c39d6] cursor-pointer"
                >
                  {Array.from({ length: 24 }).flatMap((_, i) => {
                    const pad = (n: number) => n.toString().padStart(2, "0");
                    const h = pad(i);
                    return [`${h}:00`, `${h}:15`, `${h}:30`, `${h}:45`].map((t) => (
                      <option key={t} value={t}>
                        {t} WIB
                      </option>
                    ));
                  })}
                  <option value="23:59">23:59 WIB</option>
                </select>
              </div>
            </div>

            {/* Footer Status & Done Button */}
            <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500">
                {!startDate
                  ? "Pilih tanggal awal..."
                  : !endDate
                  ? "Pilih tanggal expired..."
                  : "Rentang tanggal aktif!"}
              </span>
              <div className="flex items-center gap-2">
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => onSelectRange("", "")}
                    className="text-[10px] text-rose-500 font-bold hover:underline px-2 py-1 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 bg-[#3c39d6] text-white rounded-xl text-xs font-bold hover:bg-[#3c39d6]/90 transition-colors shadow-sm cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
};

export default function TenantDiscountsPage() {
  const [rows, setRows]               = useState<DiscountItem[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [profileOwnerId, setProfileOwnerId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage]               = useState(1);

  const [modalOpen, setModalOpen]     = useState(false);
  const [editingItem, setEditingItem] = useState<DiscountItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DiscountItem | null>(null);
  const [productModalItem, setProductModalItem] = useState<DiscountItem | null>(null);

  // Form State
  const [formName, setFormName]         = useState("");
  const [formCode, setFormCode]         = useState("");
  const [formType, setFormType]         = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [formValue, setFormValue]       = useState<number>(10);
  const [formMinPurchase, setFormMinPurchase] = useState<number>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>("");
  const [formStartDate, setFormStartDate] = useState<string>("");
  const [formEndDate, setFormEndDate]   = useState<string>("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving]         = useState(false);

  const formatDateTimeDisplay = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateFormatted = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta"
    });
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${dateFormatted}, ${hours}:${minutes} WIB`;
  };

  const toDatetimeLocal = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };


  useEffect(() => {
    fetch("/api/backend/tenant-umkm")
      .then((res) => res.json())
      .then((data) => {
        if (data?.profile?.tenant_owner_id || data?.profile?.id) {
          setProfileOwnerId(data.profile.tenant_owner_id || data.profile.id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  };

  const fetchPage = useCallback(() => {
    if (!profileOwnerId) return;
    startTransition(async () => {
      const res = await getDiscountsAction({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        profile_id: profileOwnerId,
      });

      if (res.success && res.data) {
        setRows(res.data as DiscountItem[]);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  }, [page, debouncedSearch, profileOwnerId]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormCode("");
    setFormType("PERCENTAGE");
    setFormValue(10);
    setFormMinPurchase(0);
    setFormMaxDiscount("");
    setFormStartDate("");
    setFormEndDate("");
    setFormIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (item: DiscountItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCode(item.code || "");
    setFormType(item.type as "PERCENTAGE" | "FIXED_AMOUNT");
    setFormValue(item.value);
    setFormMinPurchase(item.min_purchase);
    setFormMaxDiscount(item.max_discount != null ? item.max_discount.toString() : "");
    setFormStartDate(toDatetimeLocal(item.start_date));
    setFormEndDate(toDatetimeLocal(item.end_date));
    setFormIsActive(item.is_active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Nama promo wajib diisi");
      return;
    }
    if (!profileOwnerId) return;

    setIsSaving(true);
    try {
      const maxDiscNum = formMaxDiscount ? Number(formMaxDiscount) : null;
      const startIso = formStartDate ? new Date(formStartDate).toISOString() : null;
      const endIso = formEndDate ? new Date(formEndDate).toISOString() : null;

      if (editingItem) {
        const res = await updateDiscountAction(editingItem.id, {
          name: formName.trim(),
          code: formCode.trim() ? formCode.trim().toUpperCase() : null,
          type: formType,
          value: Number(formValue),
          min_purchase: Number(formMinPurchase),
          max_discount: maxDiscNum,
          start_date: startIso,
          end_date: endIso,
          is_active: formIsActive,
        });
        if (res.success) {
          toast.success("Diskon berhasil diperbarui");
          setModalOpen(false);
          fetchPage();
        } else {
          toast.error(res.error || "Gagal memperbarui diskon");
        }
      } else {
        const res = await createDiscountAction({
          profile_id: profileOwnerId,
          name: formName.trim(),
          code: formCode.trim() ? formCode.trim().toUpperCase() : null,
          type: formType,
          value: Number(formValue),
          min_purchase: Number(formMinPurchase),
          max_discount: maxDiscNum,
          start_date: startIso,
          end_date: endIso,
          is_active: formIsActive,
        });
        if (res.success) {
          toast.success("Promo diskon baru berhasil ditambahkan");
          setModalOpen(false);
          fetchPage();
        } else {
          toast.error(res.error || "Gagal menambahkan diskon");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: DiscountItem) => {
    try {
      const newStatus = !item.is_active;
      const res = await updateDiscountAction(item.id, { is_active: newStatus });
      if (res.success) {
        toast.success(`Diskon "${item.name}" ${newStatus ? "diaktifkan" : "dinonaktifkan"}`);
        fetchPage();
      } else {
        toast.error(res.error || "Gagal mengupdate status diskon");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const res = await deleteDiscountAction(deletingItem.id);
      if (res.success) {
        toast.success("Diskon berhasil dihapus");
        setDeletingItem(null);
        fetchPage();
      } else {
        toast.error(res.error || "Gagal menghapus diskon");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <div className="bg-white px-4 sm:px-6 lg:px-8 pt-3 pb-8 space-y-6">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-[#3c39d6] rounded-full" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pemasaran & Promosi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#030037] tracking-tighter leading-none">
            Manajemen <span className="text-[#3c39d6]">Diskon & Kupon Promo</span>
          </h1>
          <p className="text-sm text-zinc-500">
            Kelola kode promo kupon diskon dan potongan harga otomatis untuk transaksi Kasir POS dan E-Catalog.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-[#3c39d6] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#3c39d6]/90 shadow-lg shadow-[#3c39d6]/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Buat Promo Diskon
        </button>
      </div>

      {/* Card Table Container */}
      <div className="border border-zinc-200 rounded-2xl shadow-sm overflow-hidden bg-white">
        {/* Search Toolbar */}
        <div className="p-4 bg-white border-b border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari promo atau kode kupon..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black outline-none focus:ring-2 focus:ring-[#3c39d6]/10 focus:border-zinc-300 transition-all"
            />
          </div>
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            Total {total} Promo Diskon
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nama Promo / Kupon</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tipe & Nilai</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Syarat Belanja</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Periode / Expired</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-5 bg-zinc-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : rows.length > 0 ? (
                rows.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#3c39d6]">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#030037]">{item.name}</p>
                          {item.code ? (
                            <span className="inline-block bg-zinc-100 text-zinc-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-200 mt-0.5">
                              {item.code}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">Diskon Otomatis</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {item.type === "PERCENTAGE" ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                            <Percent className="w-3 h-3" /> {item.value}%
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                            <Banknote className="w-3.5 h-3.5" /> {formatRupiah(item.value)}
                          </span>
                        )}
                        {item.max_discount && item.type === "PERCENTAGE" && (
                          <span className="text-[10px] text-zinc-400">
                            (Maks {formatRupiah(item.max_discount)})
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-xs font-bold text-zinc-700">
                        {item.min_purchase > 0 ? `Min. ${formatRupiah(item.min_purchase)}` : "Tanpa Min. Belanja"}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <div className="text-[10px] font-bold text-zinc-700 leading-tight">
                        {item.start_date || item.end_date ? (
                          <div className="space-y-0.5 font-mono">
                            <div className="text-zinc-500">Mulai: <span className="text-black">{item.start_date ? formatDateTimeDisplay(item.start_date) : "Sekarang"}</span></div>
                            <div className="text-zinc-500">Exp  : <span className="text-rose-600">{item.end_date ? formatDateTimeDisplay(item.end_date) : "Selamanya"}</span></div>
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
                            Selamanya (Tanpa Expired)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all"
                      >
                        {item.is_active ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <ToggleRight className="w-4 h-4 text-emerald-600" /> Aktif
                          </span>
                        ) : (
                          <span className="bg-zinc-100 text-zinc-400 border border-zinc-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <ToggleLeft className="w-4 h-4 text-zinc-400" /> Nonaktif
                          </span>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setProductModalItem(item)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#3c39d6] border border-indigo-200 rounded-xl transition-all inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
                          title="Atur Produk Diskon"
                        >
                          <Tag className="w-3.5 h-3.5" /> Atur Produk
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-black transition-all cursor-pointer"
                          title="Edit Promo"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-2 rounded-xl hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-all cursor-pointer"
                          title="Hapus Promo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
                    Belum ada promo diskon yang dibuat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {editingItem ? "Edit Promo" : "Tambah Promo Baru"}
                </p>
                <h2 className="text-lg font-bold text-[#030037]">
                  {editingItem ? "Pengaturan Promo Diskon" : "Buat Voucher / Diskon Baru"}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nama Promo *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Promo 7.7"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black outline-none focus:border-[#3c39d6] transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kode Kupon (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: PROMO77"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-black outline-none focus:border-[#3c39d6] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tipe Diskon</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black outline-none focus:border-[#3c39d6] transition-all cursor-pointer"
                  >
                    <option value="PERCENTAGE">Persen (%)</option>
                    <option value="FIXED_AMOUNT">Nominal (Rp)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Nilai {formType === "PERCENTAGE" ? "(%)" : "(Rp)"} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black outline-none focus:border-[#3c39d6] transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Min. Belanja</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinPurchase}
                    onChange={(e) => setFormMinPurchase(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black outline-none focus:border-[#3c39d6] transition-all"
                  />
                </div>
              </div>

              {formType === "PERCENTAGE" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Maksimal Potongan Diskon (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 20000 (Kosongkan jika tanpa batas)"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black outline-none focus:border-[#3c39d6] transition-all"
                  />
                </div>
              )}

              {/* Custom Single Calendar Date Range Picker */}
              <DateRangePicker
                startDate={formStartDate}
                endDate={formEndDate}
                onSelectRange={(start, end) => {
                  setFormStartDate(start);
                  setFormEndDate(end);
                }}
              />

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3c39d6] focus:ring-[#3c39d6] cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-zinc-800 cursor-pointer">
                  Aktifkan promo ini sekarang
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-[#3c39d6] text-white rounded-xl text-xs font-bold hover:bg-[#3c39d6]/90 shadow-md shadow-[#3c39d6]/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : editingItem ? "Simpan Perubahan" : "Buat Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
              <TriangleAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#030037]">Hapus Promo Diskon?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Apakah Anda yakin ingin menghapus promo <span className="font-bold text-black">&quot;{deletingItem.name}&quot;</span>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 shadow-md shadow-rose-500/20 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atur Produk Diskon */}
      {productModalItem && profileOwnerId && (
        <DiscountProductsModal
          discount={productModalItem}
          profileOwnerId={profileOwnerId}
          onClose={() => setProductModalItem(null)}
        />
      )}
    </div>
  );
}

function DiscountProductsModal({
  discount,
  profileOwnerId,
  onClose,
}: {
  discount: DiscountItem;
  profileOwnerId: string;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [associatedProductIDs, setAssociatedProductIDs] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingID, setTogglingID] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, discProdRes] = await Promise.all([
        getProductsAction({ tenant_id: profileOwnerId }),
        getDiscountProductsAction(discount.id),
      ]);
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
      }
      if (discProdRes.success && discProdRes.product_ids) {
        setAssociatedProductIDs(discProdRes.product_ids);
      }
    } catch {
      toast.error("Gagal memuat produk toko.");
    } finally {
      setLoading(false);
    }
  }, [discount.id, profileOwnerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleProduct = async (productId: string) => {
    const isCurrentlyActive = associatedProductIDs.includes(productId);
    const newEnabled = !isCurrentlyActive;

    setAssociatedProductIDs((prev) =>
      newEnabled ? [...prev, productId] : prev.filter((id) => id !== productId)
    );
    setTogglingID(productId);

    try {
      const res = await toggleDiscountProductAction(discount.id, productId, newEnabled);
      if (res.success) {
        toast.success(
          newEnabled
            ? `Diskon "${discount.name}" AKTIF untuk produk ini`
            : `Diskon DIBATALKAN untuk produk ini`
        );
      } else {
        setAssociatedProductIDs((prev) =>
          isCurrentlyActive ? [...prev, productId] : prev.filter((id) => id !== productId)
        );
        toast.error(res.error || "Gagal mengubah status diskon produk");
      }
    } catch {
      setAssociatedProductIDs((prev) =>
        isCurrentlyActive ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setTogglingID(null);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = async () => {
    const unselectedIDs = filteredProducts
      .map((p) => p.id)
      .filter((id) => !associatedProductIDs.includes(id));
    if (unselectedIDs.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const newAssociated = Array.from(new Set([...associatedProductIDs, ...unselectedIDs]));
      setAssociatedProductIDs(newAssociated);

      await Promise.all(
        unselectedIDs.map((id) => toggleDiscountProductAction(discount.id, id, true))
      );
      toast.success(`Berhasil mengaktifkan diskon untuk ${unselectedIDs.length} produk!`);
    } catch {
      toast.error("Gagal memilih semua produk.");
      loadData();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleDeselectAll = async () => {
    const selectedIDs = filteredProducts
      .map((p) => p.id)
      .filter((id) => associatedProductIDs.includes(id));
    if (selectedIDs.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const newAssociated = associatedProductIDs.filter((id) => !selectedIDs.includes(id));
      setAssociatedProductIDs(newAssociated);

      await Promise.all(
        selectedIDs.map((id) => toggleDiscountProductAction(discount.id, id, false))
      );
      toast.info(`Berhasil menonaktifkan diskon untuk ${selectedIDs.length} produk.`);
    } catch {
      toast.error("Gagal mengosongkan pilihan produk.");
      loadData();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-indigo-50/80 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#030037] tracking-tight">Atur Produk Diskon</h3>
              <p className="text-xs text-zinc-600 font-bold">
                Promo &quot;{discount.name}&quot; ({discount.type === "PERCENTAGE" ? `${discount.value}%` : `Rp ${discount.value.toLocaleString("id-ID")}`})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/80 hover:bg-white text-zinc-500 hover:text-black border border-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Bulk Select All Toolbar */}
        <div className="p-3 bg-zinc-50/80 border-b border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari produk toko..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[11px] font-bold text-zinc-600">
              <strong className="text-emerald-600">{associatedProductIDs.length}</strong> / {products.length} Aktif
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={isBulkProcessing || filteredProducts.length === 0}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black transition-all cursor-pointer disabled:opacity-50"
              >
                ✓ Pilih Semua
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                disabled={isBulkProcessing || associatedProductIDs.length === 0}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-black transition-all cursor-pointer disabled:opacity-50"
              >
                ✕ Hapus Semua
              </button>
            </div>
          </div>
        </div>

        {/* Product Cards Grid (3 Columns Desktop, 2 Columns Mobile) */}
        <div className="p-3.5 overflow-y-auto flex-1 scrollbar-thin max-h-[62vh]">
          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-zinc-400 animate-pulse">
              Memuat daftar produk...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center space-y-1">
              <Package className="w-8 h-8 text-zinc-300 mx-auto" />
              <p className="text-xs font-bold text-zinc-500">Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((p) => {
                const isEnabled = associatedProductIDs.includes(p.id);
                const originalPrice = p.sell_price || 0;
                let discAmount = 0;
                if (discount.type === "PERCENTAGE") {
                  discAmount = (originalPrice * discount.value) / 100;
                  if (discount.max_discount && discAmount > discount.max_discount) {
                    discAmount = discount.max_discount;
                  }
                } else {
                  discAmount = discount.value;
                }
                const finalPrice = Math.max(0, originalPrice - discAmount);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleProduct(p.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 select-none relative ${
                      isEnabled
                        ? "bg-emerald-50/60 border-emerald-300 shadow-2xs ring-1 ring-emerald-300"
                        : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-2xs"
                    }`}
                  >
                    {/* Header Item: Image & Name */}
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Tag className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[11px] font-bold text-[#030037] truncate leading-tight" title={p.name}>
                          {p.name}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-zinc-500 block mt-0.5">
                          Rp {originalPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Footer Item: Discounted Price & Toggle Switch */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/60 mt-auto">
                      <div className="min-w-0">
                        {isEnabled ? (
                          <span className="text-[10px] font-black text-emerald-700 font-mono block truncate">
                            Rp {finalPrice.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-zinc-400 block">
                            Tidak Diskon
                          </span>
                        )}
                      </div>

                      {/* TOGGLE SWITCH ON / OFF */}
                      <button
                        type="button"
                        disabled={togglingID === p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleProduct(p.id);
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                          isEnabled ? "bg-emerald-500" : "bg-zinc-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-zinc-50 border-t border-zinc-200/80 flex items-center justify-between text-xs font-bold">
          <span className="text-zinc-500">
            Status promo tersimpan otomatis saat toggle diubah
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#030037] hover:bg-[#3c39d6] text-white rounded-xl font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
