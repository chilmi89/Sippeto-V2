"use client";

import React, { useEffect, useState } from "react";
import { Receipt, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const ChartsSection = dynamic(() => import("./_charts"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string | null;
  business_name: string | null;
  email: string;
  is_active: boolean | null;
  username: string | null;
}

interface FinancialSummary {
  totalPendapatan: number;
  totalPengeluaran: number;
  totalSaldo: number;
  netProfit: number;
}

interface ChartData {
  saldo:       { name: string; saldo: number }[];
  pendapatan:  { name: string; pendapatan: number }[];
  pengeluaran: { name: string; pengeluaran: number }[];
  labaRugi:    { name: string; untung: number; rugi: number }[];
}



// ─── Empty chart fallback (12 bulan kosong) ───────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

const emptyCharts: ChartData = {
  saldo:       MONTHS.map((name) => ({ name, saldo: 0 })),
  pendapatan:  MONTHS.map((name) => ({ name, pendapatan: 0 })),
  pengeluaran: MONTHS.map((name) => ({ name, pengeluaran: 0 })),
  labaRugi:    MONTHS.map((name) => ({ name, untung: 0, rugi: 0 })),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatShort = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(v) >= 1_000)     return `Rp ${(v / 1_000).toFixed(0)}rb`;
  return `Rp ${v}`;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TenantDashboard() {
  const router = useRouter();
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [summary,  setSummary]  = useState<FinancialSummary | null>(null);
  const [charts,   setCharts]   = useState<ChartData>(emptyCharts);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  // Branch Filter States
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [userBranchId, setUserBranchId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        // Fetch Profile
        const res = await fetch("/api/backend/tenant-umkm");
        if (res.ok) {
          const json = await res.json();
          setProfile(json.profile);
          const currentProfileId = json.profile.id;
          const currentBranchId = json.profile.branch_id;
          setUserBranchId(currentBranchId);
          
          // Fetch Branches
          const branchesRes = await fetch(`/api/backend/branches?tenant_id=${currentProfileId}`);
          if (branchesRes.ok) {
              const branchesJson = await branchesRes.json();
              setBranches(branchesJson.data || []);
          }

          if (currentBranchId) {
              setSelectedBranchId(currentBranchId);
          } else {
              setSelectedBranchId("all");
          }
        }
      } catch (err) {
        console.error("Failed to fetch tenant data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch financials and transactions when selected branch changes
  useEffect(() => {
    const fetchFilteredData = async () => {
      if (!profile) return;
      setIsFiltering(true);
      try {
        // Fetch Financials
        const res = await fetch(`/api/backend/tenant-umkm?branch_id=${selectedBranchId}`);
        if (res.ok) {
          const json = await res.json();
          setSummary(json.financials.summary);
          setCharts(json.financials.charts);
        }


      } catch (err) {
        console.error("Failed to fetch filtered data:", err);
      } finally {
        setTimeout(() => {
          setIsFiltering(false);
        }, 200);
      }
    };

    fetchFilteredData();
  }, [profile, selectedBranchId]);

  const displayName = profile?.business_name ?? profile?.full_name ?? "UMKM Anda";

  return (
    <div className="w-full flex flex-col gap-4 py-2 pb-20 px-4 sm:px-6">

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
              onChange={(e) => setSelectedBranchId(e.target.value)}
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
                {formatShort(summary?.totalSaldo ?? 0)}
              </span>
            </div>
            <button onClick={() => router.push("/backend/tenant/transactions")} className="ml-2 p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all group">
               <Receipt className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>



      {/* Charts 3-col horizontal — lazy loaded (Recharts gak blocking initial render) */}
      <ChartsSection summary={summary} charts={charts} isFiltering={isFiltering} />
    </div>
  );
}