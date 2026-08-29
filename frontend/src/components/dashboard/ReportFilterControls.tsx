"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Calendar, ArrowUpDown, RotateCcw, ChevronLeft, ChevronRight, X } from "lucide-react";

interface Branch {
  id: string;
  name: string;
}

interface ReportFilterControlsProps {
  branches: Branch[];
  selectedBranchId: string;
  userBranchId: string | null;
  dateStart?: string;
  dateEnd?: string;
  sortOrder?: string;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const WEEKDAY_NAMES = ["M", "S", "S", "R", "K", "J", "S"];

export default function ReportFilterControls({
  branches,
  selectedBranchId,
  userBranchId,
  dateStart = "",
  dateEnd = "",
  sortOrder = "asc",
}: ReportFilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [branchId, setBranchId] = useState(selectedBranchId);
  const [startDate, setStartDate] = useState(dateStart);
  const [endDate, setEndDate] = useState(dateEnd);
  const [sort, setSort] = useState(sortOrder);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Temporary selection state for calendar modal
  const [tempStart, setTempStart] = useState<string>(dateStart);
  const [tempEnd, setTempEnd] = useState<string>(dateEnd);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Month navigation in calendar
  const initialYearMonth = dateStart ? new Date(dateStart) : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialYearMonth.getTime()) ? new Date().getFullYear() : initialYearMonth.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialYearMonth.getTime()) ? new Date().getMonth() : initialYearMonth.getMonth()
  );

  // Sync state when props change
  useEffect(() => {
    setBranchId(selectedBranchId);
    setStartDate(dateStart);
    setEndDate(dateEnd);
    setSort(sortOrder);
    setTempStart(dateStart);
    setTempEnd(dateEnd);
  }, [selectedBranchId, dateStart, dateEnd, sortOrder]);

  // Format header date label
  const formatHeaderDate = (dStr: string) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
    const monthName = d.toLocaleDateString("id-ID", { month: "short" });
    return `${dayName}, ${d.getDate()} ${monthName}`;
  };

  const getRangeTriggerText = () => {
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const sStr = `${s.getDate()} ${s.toLocaleDateString("id-ID", { month: "short" })}`;
        const eStr = `${e.getDate()} ${e.toLocaleDateString("id-ID", { month: "short" })}`;
        return `${sStr} — ${eStr}`;
      }
    }
    if (startDate) return `Mulai ${startDate}`;
    if (endDate) return `Sampai ${endDate}`;
    return "Pilih Rentang Tanggal";
  };

  // Calendar calculations
  const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Minggu

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const toYMD = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const handleDayClick = (ymd: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(ymd);
      setTempEnd("");
    } else if (tempStart && !tempEnd) {
      if (ymd < tempStart) {
        setTempStart(ymd);
      } else {
        setTempEnd(ymd);
      }
    }
  };

  const isSelectedStart = (ymd: string) => tempStart === ymd;
  const isSelectedEnd = (ymd: string) => tempEnd === ymd;
  const isInRange = (ymd: string) => {
    if (tempStart && tempEnd) {
      return ymd >= tempStart && ymd <= tempEnd;
    }
    if (tempStart && hoverDate && !tempEnd) {
      return tempStart <= ymd && ymd <= hoverDate;
    }
    return false;
  };

  const handleApplyFilter = () => {
    setStartDate(tempStart);
    setEndDate(tempEnd);

    const params = new URLSearchParams(searchParams.toString());
    
    if (branchId && branchId !== "all") {
      params.set("branch_id", branchId);
    } else {
      params.delete("branch_id");
    }

    if (tempStart) {
      params.set("date_start", tempStart);
    } else {
      params.delete("date_start");
    }

    if (tempEnd) {
      params.set("date_end", tempEnd);
    } else {
      params.delete("date_end");
    }

    if (sort && sort !== "asc") {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }

    router.push(`${pathname}?${params.toString()}`);
    setIsCalendarOpen(false);
  };

  const handlePreset = (preset: "today" | "last7" | "last30" | "thisMonth" | "thisYear") => {
    const now = new Date();
    const formatYMD = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "today") {
      const t = formatYMD(now);
      setTempStart(t);
      setTempEnd(t);
    } else if (preset === "last7") {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setTempStart(formatYMD(past));
      setTempEnd(formatYMD(now));
    } else if (preset === "last30") {
      const past = new Date();
      past.setDate(past.getDate() - 29);
      setTempStart(formatYMD(past));
      setTempEnd(formatYMD(now));
    } else if (preset === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setTempStart(formatYMD(start));
      setTempEnd(formatYMD(now));
    } else if (preset === "thisYear") {
      const start = new Date(now.getFullYear(), 0, 1);
      setTempStart(formatYMD(start));
      setTempEnd(formatYMD(now));
    }
  };

  const handleResetFilter = () => {
    setBranchId(userBranchId || "all");
    setStartDate("");
    setEndDate("");
    setTempStart("");
    setTempEnd("");
    setSort("asc");
    router.push(pathname);
    setIsCalendarOpen(false);
  };

  return (
    <>
      {/* Container Filter Responsive Sebaris */}
      <div className="w-full bg-white/90 backdrop-blur-md px-4 sm:px-6 py-3.5 rounded-2xl border border-zinc-150 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-30">
        
        {/* Deretan Kontrol Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          
          {/* 1. Dropdown Cabang */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              disabled={!!userBranchId}
              className="w-full sm:w-auto pl-3.5 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:bg-zinc-100 disabled:text-zinc-500"
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value && e.target.value !== "all") {
                  params.set("branch_id", e.target.value);
                } else {
                  params.delete("branch_id");
                }
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              {!userBranchId && <option value="all">Semua Cabang</option>}
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="text-black">
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>

          {/* 2. Tombol Trigger Modal Kalender */}
          <button
            type="button"
            onClick={() => {
              setTempStart(startDate);
              setTempEnd(endDate);
              setIsCalendarOpen(true);
            }}
            className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 px-4 py-2.5 bg-zinc-50 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
              startDate || endDate
                ? "border-primary text-primary bg-primary/5 shadow-xs"
                : "border-zinc-200 text-black hover:bg-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate text-black">
                {getRangeTriggerText()}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>

          {/* 3. Urutan Data (ASC / DESC) */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              className="w-full sm:w-auto pl-8 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              value={sort}
              onChange={(e) => {
                const newSort = e.target.value;
                setSort(newSort);
                const params = new URLSearchParams(searchParams.toString());
                if (newSort !== "asc") {
                  params.set("sort", newSort);
                } else {
                  params.delete("sort");
                }
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              <option value="asc" className="text-black">Terlama → Terbaru (ASC)</option>
              <option value="desc" className="text-black">Terbaru → Terlama (DESC)</option>
            </select>
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Reset Filter Button */}
        {(startDate || endDate || sort !== "asc" || (branchId && branchId !== "all" && !userBranchId)) && (
          <button
            onClick={handleResetFilter}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors bg-rose-50 px-3.5 py-2 rounded-xl cursor-pointer w-full sm:w-auto mt-2 sm:mt-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* ─── MODAL DIALOG DI TENGAH LAYAR (RESPONSIVE HP & DESKTOP, TANPA TERPOTONG) ─── */}
      {isCalendarOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200"
          onClick={() => setIsCalendarOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-[340px] rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Material Style Ungu/Primary */}
            <div className="bg-primary p-5 text-white flex items-start justify-between relative">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/70 block">
                  SELECT RANGE
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1 leading-tight">
                  {tempStart && tempEnd ? (
                    `${formatHeaderDate(tempStart)} — ${formatHeaderDate(tempEnd)}`
                  ) : tempStart ? (
                    formatHeaderDate(tempStart)
                  ) : (
                    "Pilih Tanggal"
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigasi Bulan & Tahun */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-white">
              <span className="text-sm font-bold text-black">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors cursor-pointer"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors cursor-pointer"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Label Hari dalam Seminggu */}
            <div className="grid grid-cols-7 text-center pt-3 px-4 text-[11px] font-bold text-zinc-400">
              {WEEKDAY_NAMES.map((w, idx) => (
                <div key={idx} className="py-1">{w}</div>
              ))}
            </div>

            {/* Grid Tanggal Kalender */}
            <div className="grid grid-cols-7 gap-y-1 p-4 text-center text-xs font-bold text-black">
              {/* Offset awal bulan */}
              {Array.from({ length: firstDayOffset }).map((_, idx) => (
                <div key={`offset-${idx}`} />
              ))}

              {/* Angka tanggal dalam bulan */}
              {Array.from({ length: daysInViewMonth }).map((_, idx) => {
                const day = idx + 1;
                const ymd = toYMD(viewYear, viewMonth, day);
                const isStart = isSelectedStart(ymd);
                const isEnd = isSelectedEnd(ymd);
                const inRange = isInRange(ymd);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(ymd)}
                    onMouseEnter={() => setHoverDate(ymd)}
                    className={`h-8 flex items-center justify-center text-xs transition-all relative ${
                      isStart || isEnd
                        ? "bg-primary text-white font-black rounded-full shadow-md z-10 scale-105"
                        : inRange
                        ? "bg-primary/20 text-primary font-bold rounded-none"
                        : "hover:bg-zinc-100 text-black rounded-full cursor-pointer"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Tombol Cepat (Presets) */}
            <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/50">
              <button
                type="button"
                onClick={() => handlePreset("today")}
                className="px-2.5 py-1 bg-white border border-zinc-200 hover:bg-primary/10 hover:border-primary text-[10px] font-bold text-black rounded-lg transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handlePreset("last7")}
                className="px-2.5 py-1 bg-white border border-zinc-200 hover:bg-primary/10 hover:border-primary text-[10px] font-bold text-black rounded-lg transition-colors cursor-pointer"
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => handlePreset("last30")}
                className="px-2.5 py-1 bg-white border border-zinc-200 hover:bg-primary/10 hover:border-primary text-[10px] font-bold text-black rounded-lg transition-colors cursor-pointer"
              >
                30 Hari
              </button>
              <button
                type="button"
                onClick={() => handlePreset("thisMonth")}
                className="px-2.5 py-1 bg-white border border-zinc-200 hover:bg-primary/10 hover:border-primary text-[10px] font-bold text-black rounded-lg transition-colors cursor-pointer"
              >
                Bulan Ini
              </button>
            </div>

            {/* Footer Aksi CANCEL & OK */}
            <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-zinc-100 bg-white">
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleApplyFilter}
                className="px-5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-md hover:bg-primary-hover transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
