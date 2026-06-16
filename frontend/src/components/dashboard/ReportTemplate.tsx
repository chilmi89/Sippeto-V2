"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, Wallet, CalendarRange, ArrowLeft, FileSpreadsheet, FileText, ChevronDown
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import FullPageLoader from "@/components/layout/FullPageLoader";
import SectionLoader from "@/components/layout/SectionLoader";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";

interface ReportTemplateProps {
  type: "daily" | "weekly" | "monthly" | "yearly";
  title: string;
}

interface FinancialSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
}

interface ReportData {
  period: string;
  total_income: number;
  total_expense: number;
  net_balance: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const formatShort = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(v) >= 1_000)     return `Rp ${(v / 1_000).toFixed(0)}rb`;
  return `Rp ${v}`;
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#030037] text-white px-5 py-4 rounded-xl shadow-2xl text-xs font-bold border border-white/10">
      <p className="text-white/40 mb-2 text-[10px] uppercase tracking-widest">{label}</p>
      {payload.map((p: any, i: number) => (
         <p key={i} style={{ color: p.color || "#fff" }} className="text-sm font-black">
           {p.name.toUpperCase()}: {formatCurrency(p.value)}
         </p>
      ))}
    </div>
  );
};

export default function ReportTemplate({ type, title }: ReportTemplateProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [data, setData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  // Branch Filter States
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [userBranchId, setUserBranchId] = useState<string | null>(null);

  // 1. Initial Load: Profile & Branches
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const profileRes = await fetch("/api/backend/tenant-umkm");
        if (!profileRes.ok) throw new Error("Gagal mengambil profil tenant");
        
        const profileJson = await profileRes.json();
        setProfile(profileJson.profile);
        const id = profileJson.profile.tenant_owner_id || profileJson.profile.id;
        setProfileId(id);
        
        const currentBranchId = profileJson.profile.branch_id;
        setUserBranchId(currentBranchId);

        // Fetch Branches
        const branchesRes = await fetch(`/api/backend/branches?tenant_id=${id}`);
        if (branchesRes.ok) {
            const branchesJson = await branchesRes.json();
            setBranches(branchesJson.data || []);
        }

        if (currentBranchId) {
            setSelectedBranchId(currentBranchId);
        } else {
            setSelectedBranchId("all");
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Load Report Data when selectedBranchId, profileId, or type changes
  useEffect(() => {
    const fetchReportData = async () => {
      if (!profileId) return;
      setIsFiltering(true);
      try {
        const reportRes = await fetch(
          `/api/backend/reports/sales?profile_id=${profileId}&type=${type}` +
          (selectedBranchId !== "all" ? `&branch_id=${selectedBranchId}` : "")
        );
        if (reportRes.ok) {
           const reportJson = await reportRes.json();
           setData(reportJson.data || []);
           setSummary(reportJson.summary || { total_income: 0, total_expense: 0, net_balance: 0 });
        }
      } catch (err) {
         console.error("Fetch report data error:", err);
      } finally {
        setTimeout(() => {
          setIsFiltering(false);
        }, 200);
      }
    };

    fetchReportData();
  }, [profileId, selectedBranchId, type]);

  // ─── Export Handlers ──────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const branchName = selectedBranchId === "all" 
      ? "Semua Cabang" 
      : (branches.find(b => b.id === selectedBranchId)?.name || "Cabang");

    const sheetData = data.map(row => ({
      Periode: row.period,
      'Total Pemasukan': row.total_income,
      'Total Pengeluaran': row.total_expense,
      'Saldo Bersih': row.net_balance
    }));
    
    sheetData.push({
      Periode: "TOTAL",
      'Total Pemasukan': summary?.total_income || 0,
      'Total Pengeluaran': summary?.total_expense || 0,
      'Saldo Bersih': summary?.net_balance || 0
    });

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");
    
    const cleanBranchName = branchName.replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Laporan_${type}_${cleanBranchName}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const branchName = selectedBranchId === "all" 
      ? "Semua Cabang" 
      : (branches.find(b => b.id === selectedBranchId)?.name || "Cabang");

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Tipe Laporan: ${type.toUpperCase()}`, 14, 30);
    doc.text(`Cabang: ${branchName}`, 14, 36);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 42);

    const tableColumn = ["Periode", "Total Pemasukan", "Total Pengeluaran", "Saldo Bersih"];
    const tableRows = data.map(row => [
      row.period,
      formatCurrency(row.total_income),
      formatCurrency(row.total_expense),
      formatCurrency(row.net_balance)
    ]);

    tableRows.push([
      "TOTAL",
      formatCurrency(summary?.total_income || 0),
      formatCurrency(summary?.total_expense || 0),
      formatCurrency(summary?.net_balance || 0)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 48,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [3, 0, 55] },
    });
    
    const cleanBranchName = branchName.replace(/\s+/g, '_');
    doc.save(`Laporan_${type}_${cleanBranchName}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const maxVal = data.reduce((max, d) => Math.max(max, d.total_income, d.total_expense), 1);

  return (
    <div className="w-full flex flex-col gap-4 py-2 pb-20 px-4 sm:px-6">
      {isLoading && <FullPageLoader />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-2">
        <div className="max-w-xl">
          <button 
            onClick={() => router.push("/backend/tenant")}
            className="flex items-center gap-2 text-zinc-400 hover:text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-3 transition-colors group cursor-pointer border-0 bg-transparent p-0 outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Dashboard
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#030037] tracking-tighter leading-[1.1]">
            {title}
          </h1>
          <p className="text-zinc-500 font-medium text-sm mt-3">
            Analisis data penjualan dan aktivitas finansial Anda secara komprehensif.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/80 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-zinc-100 shadow-sm self-start sm:self-center">
            {/* Format Info */}
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-zinc-50 text-zinc-400 rounded-xl">
                  <CalendarRange className="w-5 h-5" />
               </div>
               <div>
                  <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest leading-none block mb-0.5">Format</span>
                  <h2 className="text-sm font-black text-[#030037] leading-none capitalize">{type}</h2>
               </div>
            </div>
            
            <div className="hidden sm:block w-px h-8 bg-zinc-200/80 sm:mx-1"></div>

            {/* Dropdown Filter Cabang */}
            <div className="relative group shrink-0 w-full sm:w-auto">
              <select
                disabled={!!userBranchId}
                className="w-full sm:w-auto min-w-[170px] pl-4 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-950 appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-200 disabled:bg-zinc-100 disabled:text-zinc-500"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="all">Semua Cabang (Pusat)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none group-focus-within:text-primary transition-colors" />
            </div>

            <div className="hidden sm:block w-px h-8 bg-zinc-200/80 sm:mx-1"></div>
            
            {/* Export Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
               <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest leading-none shrink-0">Unduh:</span>
               <div className="flex items-center gap-2">
                  <button onClick={handleExportExcel} className="flex items-center gap-1.5 p-2.5 px-3.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm hover:shadow-md hover:shadow-emerald-500/10 active:scale-95 cursor-pointer" title="Unduh Laporan Excel">
                     <FileSpreadsheet className="w-3.5 h-3.5" />
                     <span>Excel</span>
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 p-2.5 px-3.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm hover:shadow-md hover:shadow-rose-500/10 active:scale-95 cursor-pointer" title="Unduh Laporan PDF">
                     <FileText className="w-3.5 h-3.5" />
                     <span>PDF</span>
                  </button>
               </div>
            </div>
        </div>
      </div>

      {/* Summary Widgets */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300 ease-in-out ${
        isFiltering ? "opacity-40 blur-[1px] scale-[0.995]" : "opacity-100 blur-0 scale-100"
      }`}>
         {/* Total Income */}
         <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
               <TrendingUp className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="relative z-10 flex items-center gap-3 mb-4">
               <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Pemasukan</span>
            </div>
            <div className="relative z-10">
               <h3 className="text-3xl font-bold text-[#030037]">{formatCurrency(summary?.total_income || 0)}</h3>
            </div>
         </div>

         {/* Total Expense */}
         <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
               <TrendingDown className="w-24 h-24 text-rose-500" />
            </div>
            <div className="relative z-10 flex items-center gap-3 mb-4">
               <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                  <TrendingDown className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Pengeluaran</span>
            </div>
            <div className="relative z-10">
               <h3 className="text-3xl font-bold text-[#030037]">{formatCurrency(summary?.total_expense || 0)}</h3>
            </div>
         </div>

         {/* Net Balance */}
         <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
               <Wallet className="w-24 h-24 text-primary" />
            </div>
            <div className="relative z-10 flex items-center gap-3 mb-4">
               <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Wallet className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Saldo Bersih</span>
            </div>
            <div className="relative z-10">
               <h3 className={`text-3xl font-bold ${(summary?.net_balance || 0) < 0 ? 'text-rose-500' : 'text-primary'}`}>
                  {formatCurrency(summary?.net_balance || 0)}
               </h3>
            </div>
         </div>
      </div>

      {/* Main Chart */}
      <div className={`bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8 shadow-sm flex flex-col h-[400px] mt-2 transition-all duration-300 ease-in-out ${
        isFiltering ? "opacity-40 blur-[1px] scale-[0.995]" : "opacity-100 blur-0 scale-100"
      }`}>
         <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4 mb-4 relative z-10">
            <div>
               <h3 className="text-xl font-bold text-[#030037] tracking-tight">Kinerja Arus Kas</h3>
               <p className="text-xs text-zinc-400 font-medium">Perbandingan pemasukan dan pengeluaran</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-zinc-500 uppercase">Pemasukan</span></div>
               <div className="flex items-center gap-1.5 ml-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-[10px] font-bold text-zinc-500 uppercase">Pengeluaran</span></div>
            </div>
         </div>
 
         <div className="w-full">
            <ResponsiveContainer width="100%" height={280}>
               <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                     <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                     </linearGradient>
                     <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 9, fill: "#a1a1aa", fontWeight: 800 }} axisLine={{ stroke: "#f1f1f4" }} tickLine={false} dy={8} />
                  <YAxis domain={[0, 'auto']} tick={{ fontSize: 9, fill: "#a1a1aa", fontWeight: 800 }} axisLine={{ stroke: "#f1f1f4" }} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`} width={45} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                  <Area type="natural" name="Pemasukan" dataKey="total_income" stroke="#10b981" strokeWidth={3} fill="url(#gIncome)" activeDot={{ r: 6, strokeWidth: 2, fill: "#fff", stroke: "#10b981" }} animationDuration={1500} />
                  <Area type="natural" name="Pengeluaran" dataKey="total_expense" stroke="#f43f5e" strokeWidth={3} fill="url(#gExpense)" activeDot={{ r: 6, strokeWidth: 2, fill: "#fff", stroke: "#f43f5e" }} animationDuration={1500} />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
 
      {/* Rincian Data Table */}
      <div className={`bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm mt-2 transition-all duration-300 ease-in-out ${
        isFiltering ? "opacity-40 blur-[1px] scale-[0.995]" : "opacity-100 blur-0 scale-100"
      }`}>
         <div className="p-6 border-b border-zinc-100">
            <h3 className="text-lg font-bold text-[#030037] tracking-tight">Rincian Per Periode</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-50">
                     <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-1/4">Periode ({type})</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-1/4">Pemasukan</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-1/4">Pengeluaran</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-1/4">Saldo Bersih</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-50">
                  {isLoading ? (
                     <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                           <SectionLoader text="Memuat Rincian Laporan..." />
                        </td>
                     </tr>
                  ) : data.length > 0 ? (
                     data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <span className="text-xs font-bold text-[#030037]">{row.period}</span>
                           </td>
                           <td className="px-6 py-4 text-xs font-black text-emerald-600">{formatCurrency(row.total_income)}</td>
                           <td className="px-6 py-4 text-xs font-black text-rose-600">{formatCurrency(row.total_expense)}</td>
                           <td className="px-6 py-4">
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${row.net_balance >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                                 {formatCurrency(row.net_balance)}
                              </span>
                           </td>
                        </tr>
                     ))
                  ) : (
                     <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 text-xs font-medium italic">
                           Tidak ada data penjualan pada periode ini.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
