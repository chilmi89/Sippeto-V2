"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Search,
  Calendar,
  MoreVertical,
  Banknote,
  Receipt,
  ChevronRight,
  TrendingUp,
  FileText,
  Filter,
  CheckCircle2,
  Clock
} from "lucide-react";
import FullPageLoader from "@/components/layout/FullPageLoader";
import Link from "next/link";

// Placeholder data for global transactions
const recentTransactions = [
  { id: "TX-9012", tenant: "Sate Khas Senayan", amount: 1250000, type: "INCOME", date: "2026-03-27", status: "Success", method: "QRIS" },
  { id: "TX-9013", tenant: "Warung Bu Siti", amount: 450000, type: "EXPENSE", date: "2026-03-27", status: "Success", method: "Tunai" },
  { id: "TX-9014", tenant: "Kopi Kenangan", amount: 890000, type: "INCOME", date: "2026-03-26", status: "Success", method: "Transfer" },
  { id: "TX-9015", tenant: "Toko Sembako Jaya", amount: 2100000, type: "INCOME", date: "2026-03-26", status: "Pending", method: "QRIS" },
  { id: "TX-9016", tenant: "Apotek Medika", amount: 320000, type: "EXPENSE", date: "2026-03-25", status: "Success", method: "Transfer" },
];

const TransactionDashboard = () => {
  const [filter, setFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div 
      className="flex flex-col gap-8 w-full max-w-full pb-8 animate-in fade-in duration-500"
      suppressHydrationWarning
    >
      {isLoading && <FullPageLoader />}
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-1">
        <Link href="/backend/admin" className="hover:text-primary transition-all">Admin</Link>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="text-zinc-500">Financial Control</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="w-4 h-[2px] bg-primary rounded-full"></div>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Global Ledger</span>
          </div>
          <h1 className="text-3xl font-bold text-[#030037] tracking-tighter leading-none">
            Dashboard <span className="text-primary font-medium">Transaksi</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 max-w-xl">
            Monitoring arus keuangan seluruh tenant SiPetto secara real-time dengan validasi otomatis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:bg-white hover:shadow-md transition-all active:scale-95">
            <Calendar className="w-4 h-4" /> Filter Periode
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#030037] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-[#030037]/20 active:scale-95">
            <Download className="w-4 h-4" /> Export Ledger
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Volume", value: 145000000, icon: Banknote, color: "text-[#030037]", bg: "bg-white", trend: "+12.5%", sub: "Bulan ini" },
          { label: "Total Income", value: 92000000, icon: ArrowUpRight, color: "text-emerald-500", bg: "bg-white", trend: "+8.2%", sub: "Verifikasi Berhasil" },
          { label: "Total Expense", value: 53000000, icon: ArrowDownLeft, color: "text-rose-500", bg: "bg-white", trend: "-4.1%", sub: "Biaya Operasional" },
          { label: "Net Revenue", value: 39000000, icon: TrendingUp, color: "text-primary", bg: "bg-white", trend: "+15.0%", sub: "Sistem Margin" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-xl border border-zinc-100 shadow-xl shadow-zinc-200/5 group hover:scale-[1.02] hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-zinc-50 rounded-full group-hover:bg-primary/5 transition-colors duration-500" />
            
            <div className="relative z-10 space-y-5">
              <div className="flex justify-between items-start">
                <div className={`p-2.5 bg-zinc-50 rounded-xl group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300`}>
                  <stat.icon className={`w-4 h-4 ${stat.color} opacity-80 group-hover:opacity-100`} />
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {stat.trend}
                </span>
              </div>
              <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                    {stat.label}
                  </p>
                <h2 className={`text-2xl font-bold tracking-tighter ${stat.color}`}>{formatIDR(stat.value)}</h2>
                <div className="flex items-center gap-1.5 pt-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">{stat.sub}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Table Area */}
      <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden shadow-xl shadow-zinc-200/10 flex flex-col">
        <div className="p-8 border-b border-zinc-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="space-y-1">
                 <h2 className="text-xl font-bold text-[#030037] tracking-tight">Mutasi Ledger</h2>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global Transaction Logs</p>
              </div>
              <div className="flex bg-zinc-50 p-1 rounded-xl border border-zinc-100 shadow-sm">
                 {["All", "Income", "Expense"].map((btn) => (
                   <button 
                    key={btn}
                    onClick={() => setFilter(btn)}
                    suppressHydrationWarning
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      filter === btn 
                        ? 'bg-[#030037] text-white shadow-lg shadow-zinc-200' 
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                   >
                     {btn}
                   </button>
                 ))}
              </div>
           </div>
           
           <div className="relative group w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Cari Tenant atau Kode Transaksi..." 
                className="w-full pl-12 pr-6 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all shadow-sm"
              />
           </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Informasi Log</th>
                <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Origin Partner</th>
                <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gateway</th>
                <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Value Asset</th>
                <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status Auth</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#030037] group-hover:text-primary transition-colors">{tx.id}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                         <Clock className="w-3 h-3 text-zinc-300" />
                         <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{tx.date}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-[#030037] font-bold text-xs border border-zinc-200 shadow-inner group-hover:scale-110 transition-transform">
                          {tx.tenant.charAt(0)}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-600">{tx.tenant}</span>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Verified Partner</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200/50 group-hover:bg-white transition-colors">
                       <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                       <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{tx.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                       <span className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {tx.type === 'INCOME' ? '+' : '-'}{formatIDR(tx.amount)}
                       </span>
                       <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mt-0.5">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit ${
                      tx.status === 'Success' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                        : 'bg-orange-50 border-orange-100 text-orange-600'
                    }`}>
                       {tx.status === 'Success' ? (
                         <CheckCircle2 className="w-3.5 h-3.5" />
                       ) : (
                         <Clock className="w-3.5 h-3.5 animate-spin" />
                       )}
                       <span className="text-[9px] font-bold uppercase tracking-widest">{tx.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-zinc-300 hover:text-[#030037] hover:bg-white hover:shadow-md border border-transparent hover:border-zinc-100 rounded-lg transition-all active:scale-95">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t border-zinc-50 bg-zinc-50/30 flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                       {i}
                    </div>
                 ))}
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">5 of 1,240 Entries recorded</p>
           </div>
           
           <div className="flex gap-3" suppressHydrationWarning>
              <button disabled className="px-6 py-2.5 bg-white border border-zinc-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-300 cursor-not-allowed">Previous</button>
              <button className="px-6 py-2.5 bg-[#030037] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-[#030037]/10 hover:bg-black transition-all active:scale-95">Next Segment</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDashboard;