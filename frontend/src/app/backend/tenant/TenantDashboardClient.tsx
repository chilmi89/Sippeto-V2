"use client";

import React, { useState, useTransition } from "react";
import { Receipt, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getTenantFinancialsAction } from "./actions";

const ChartsSection = dynamic(() => import("./_charts"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string | null;
  business_name: string | null;
  email: string;
  is_active: boolean | null;
  username: string | null;
  branch_id?: string | null;
}

interface FinancialSummary {
  totalPendapatan: number;
  totalPengeluaran: number;
  totalSaldo: number;
  netProfit: number;
}

interface ChartData {
  saldo: { name: string; saldo: number }[];
  pendapatan: { name: string; pendapatan: number }[];
  pengeluaran: { name: string; pengeluaran: number }[];
  labaRugi: { name: string; untung: number; rugi: number }[];
}

interface Branch {
  id: string;
  name: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

const emptyCharts: ChartData = {
  saldo: MONTHS.map((name) => ({ name, saldo: 0 })),
  pendapatan: MONTHS.map((name) => ({ name, pendapatan: 0 })),
  pengeluaran: MONTHS.map((name) => ({ name, pengeluaran: 0 })),
  labaRugi: MONTHS.map((name) => ({ name, untung: 0, rugi: 0 })),
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

interface TenantDashboardClientProps {
  initialProfile: Profile;
  initialFinancials: {
    summary: FinancialSummary;
    charts: ChartData;
  } | null;
  branches: Branch[];
  userBranchId: string | null;
  initialBranchId: string;
}

export default function TenantDashboardClient({
  initialProfile,
  initialFinancials,
  branches,
  userBranchId,
  initialBranchId,
}: TenantDashboardClientProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<FinancialSummary | null>(initialFinancials?.summary || null);
  const [charts, setCharts] = useState<ChartData>(initialFinancials?.charts || emptyCharts);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId || "all");
  const [isPending, startTransition] = useTransition();

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    startTransition(async () => {
      const res = await getTenantFinancialsAction(branchId);
      if (res.status === "success" && res.summary) {
        setSummary(res.summary);
        if (res.charts) {
          setCharts(res.charts);
        }
      }
    });
  };

  const displayName = initialProfile?.business_name ?? initialProfile?.full_name ?? "UMKM Anda";

  return (
    <div className="w-full flex flex-col gap-6 py-2 pb-20 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-2">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
            <div className="w-6 h-1 bg-primary rounded-full" />
            Dashboard Tenant UMKM
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#030037] tracking-tighter leading-[1.1]">
            Selamat Datang, <span className="text-primary">{displayName}</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm mt-3">
            Laporan grafik performa finansial real-time Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          {/* Dropdown Filter Cabang */}
          <div className="relative group">
            <select
              disabled={!!userBranchId}
              className="px-4 py-3.5 bg-white/80 border border-zinc-150 rounded-xl text-xs font-bold text-zinc-950 shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/5 pr-8 disabled:bg-zinc-100 disabled:text-zinc-500"
              value={selectedBranchId}
              onChange={(e) => handleBranchChange(e.target.value)}
            >
              <option value="all">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl border border-zinc-100 shadow-sm">
            <div className="flex flex-col items-start sm:items-end gap-1">
              <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest leading-none">Saldo Bersih</span>
              <span className={`font-bold text-sm ${(summary?.totalSaldo ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {formatCurrency(summary?.totalSaldo ?? 0)}
              </span>
            </div>
            <button
              onClick={() => router.push("/backend/tenant/transactions")}
              className="ml-2 p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all group"
              title="Kelola Transaksi"
            >
              <Receipt className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* 6 Grafik Lengkap */}
      <ChartsSection summary={summary} charts={charts} isFiltering={isPending} />
    </div>
  );
}
