"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingBag,
  Activity,
  Calendar,
  ChevronRight,
  TrendingUp,
  Clock,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { getDashboardStatsAction } from "@/app/actions/dashboard";

interface StatsData {
  label: string;
  value: string;
  growth: string;
  up: boolean;
  type: string;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  type: string;
}

interface ChartItem {
  name: string;
  revenue: number;
  profit: number;
}

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<{ full_name: string | null; email: string; role_name: string | null } | null>(null);
  const [mainStats, setMainStats] = useState<StatsData[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    setMounted(true);
    
    const fetchData = async () => {
      try {
        const [authRes, statsData] = await Promise.all([
          fetch("/api/auth/me"),
          getDashboardStatsAction()
        ]);

        if (authRes.ok) {
          const authData = await authRes.json();
          setCurrentUser(authData);
        }

        if (statsData.status === "success" && statsData.data) {
          setMainStats(statsData.data.mainStats || []);
          setChartData(statsData.data.chartData || []);
          setActivities(statsData.data.activities || []);
        } else {
          setError(statsData.message || "Gagal memuat statistik dashboard");
        }
      } catch (err) {
        console.error("Fetch dashboard error:", err);
        setError("Kesalahan jaringan saat memuat data");
      }
    };

    fetchData();
  }, []);

  const displayName = currentUser?.full_name
    || currentUser?.email?.split("@")[0]
    || "Admin";

  const getIcon = (type: string) => {
    switch(type) {
      case "health": return ShieldCheck;
      case "income": return Wallet;
      case "active": return Building2;
      case "order": return ShoppingBag;
      case "system": return Zap;
      case "user": return Users;
      default: return Activity;
    }
  };

  const getColor = (type: string) => {
    switch(type) {
        case "health": return "text-emerald-500";
        case "income": return "text-primary";
        case "active": return "text-blue-500";
        case "order": return "text-orange-500";
        case "system": return "text-blue-400";
        case "user": return "text-emerald-400";
        default: return "text-zinc-500";
    }
  };

  const getBg = (type: string) => {
    switch(type) {
        case "health": return "bg-emerald-50";
        case "income": return "bg-primary/5";
        case "active": return "bg-blue-50";
        case "order": return "bg-orange-50";
        default: return "bg-zinc-50";
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-8 w-full max-w-full pb-8 animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-1">
        <span className="text-primary">Overview</span>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="text-zinc-500">Admin Metrics</span>
      </div>

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="w-4 h-[2px] bg-primary rounded-full"></div>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Global Control Center</span>
          </div>
          <h1 className="text-3xl font-bold text-[#030037] tracking-tighter leading-none">
            Selamat datang, <span className="text-primary font-medium">{displayName}</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 max-w-xl">
             Monitoring traffic request, kesehatan node, dan integritas data SiPetto secara real-time.
          </p>
        </div>

        <button 
          className="flex items-center gap-2 px-6 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:bg-white hover:shadow-md transition-all active:scale-95 group font-sans"
          suppressHydrationWarning
        >
          <Calendar className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </button>
      </div>

      {error ? (
        <div className="p-10 text-center bg-rose-50 border border-rose-100 rounded-2xl flex flex-col items-center gap-4">
           <AlertCircle className="w-12 h-12 text-rose-300" />
           <p className="text-sm font-bold text-rose-500 uppercase tracking-widest">{error}</p>
           <button 
             onClick={() => window.location.reload()}
             className="px-6 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
           >
             Coba Lagi
           </button>
        </div>
      ) : (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainStats.map((stat) => {
              const IconComp = getIcon(stat.type);
              return (
                <div key={stat.label} className="bg-white p-7 rounded-xl border border-zinc-100 shadow-xl shadow-zinc-200/10 group hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 -mr-8 -mt-8 bg-zinc-50 rounded-full group-hover:bg-primary/5 transition-colors duration-500" />
                  
                  <div className="relative z-10 space-y-5">
                    <div className="flex justify-between items-start">
                      <div className={`p-2.5 ${getBg(stat.type)} ${getColor(stat.type)} rounded-xl transition-all group-hover:scale-110 shadow-sm`}>
                        <IconComp className="w-4.5 h-4.5" />
                      </div>
                      <div className={`flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-lg ${stat.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {stat.up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                        {stat.growth}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                          {stat.label}
                        </p>
                      <h2 className="text-2xl font-bold text-[#030037] tracking-tighter group-hover:text-primary transition-colors">{stat.value}</h2>
                      <div className="flex items-center gap-1.5 pt-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          {stat.type === 'income' ? 'Total Volume Penjualan' : stat.type === 'health' ? 'Net Profitability' : stat.type === 'active' ? 'Mitra Terintegrasi' : 'Transaksi Sukses'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts & Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Real Chart Card */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-100 shadow-xl shadow-zinc-200/10 p-8 flex flex-col gap-8 min-h-[500px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <h3 className="text-lg font-bold text-[#030037] tracking-tight">Revenue Growth Analysis</h3>
                   </div>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global GMV • Monthly Distribution</p>
                </div>
                <select 
                  className="bg-zinc-50 border border-zinc-200 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all cursor-pointer font-sans shadow-sm"
                  suppressHydrationWarning
                >
                  <option>12 Bulan Terakhir</option>
                  <option>30 Hari Terakhir</option>
                </select>
              </div>
              
              <div className="w-full -ml-4">
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                    <defs>
                      <filter id="shadowRev" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#3c39d6" floodOpacity="0.4" />
                      </filter>
                      <filter id="shadowPro" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#10b981" floodOpacity="0.3" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f2f5" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                      tickFormatter={(val) => `Rp ${val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : val.toLocaleString()}`}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#f1f5f9', strokeWidth: 32 }}
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
                        fontSize: '11px', 
                        fontWeight: 700,
                        padding: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)'
                      }} 
                      labelStyle={{ color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      itemStyle={{ fontWeight: 'bold' }}
                      formatter={(val: any, name: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, name === 'revenue' ? 'Gross Revenue' : 'Net Profit']}
                    />
                    <Line 
                      type="natural" 
                      dataKey="revenue" 
                      stroke="#3c39d6" 
                      strokeWidth={5} 
                      filter="url(#shadowRev)"
                      animationDuration={2500}
                      dot={{ r: 6, fill: '#fff', stroke: '#3c39d6', strokeWidth: 3 }}
                      activeDot={{ r: 8, fill: '#3c39d6', stroke: '#fff', strokeWidth: 3 }}
                    />
                    <Line 
                      type="natural" 
                      dataKey="profit" 
                      stroke="#10b981" 
                      strokeWidth={4} 
                      strokeDasharray="8 6"
                      filter="url(#shadowPro)"
                      animationDuration={2500}
                      dot={{ r: 5, fill: '#fff', stroke: '#10b981', strokeWidth: 3 }}
                      activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-[#030037] rounded-xl p-8 text-white flex flex-col gap-8 shadow-2xl shadow-[#030037]/20 relative overflow-hidden group min-h-[500px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-[100px] animate-pulse" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full -ml-24 -mb-24 blur-[80px]" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                   <h3 className="text-xl font-bold tracking-tight">Signal Operasional</h3>
                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] leading-none">Real-time Activity Hub</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
              </div>
              
              <div className="flex-1 flex flex-col gap-6 relative z-10 mt-2">
                {activities.length === 0 ? (
                    <div className="py-20 text-center space-y-3">
                        <Clock className="w-10 h-10 text-white/10 mx-auto" />
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Tidak ada aktivitas baru</p>
                    </div>
                ) : (
                    activities.map((item) => {
                        const IconComp = getIcon(item.type);
                        return (
                        <div key={item.id} className="flex items-start gap-5 group/list cursor-pointer p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5">
                            <div className="w-11 h-11 shrink-0 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 transition-all group-hover/list:bg-white group-hover/list:scale-110 shadow-lg group-hover/list:shadow-primary/50">
                            <IconComp className={`w-5 h-5 ${getColor(item.type)} transition-colors group-hover/list:text-primary`} />
                            </div>
                            <div className="space-y-1.5 flex-1">
                            <div className="flex items-center justify-between w-full">
                                <p className="text-sm font-bold text-white/95 leading-none tracking-tight">{item.user}</p>
                                <span className="text-[9px] font-bold uppercase text-white/20 tracking-widest">{item.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-primary/40" />
                                <span className="text-white/50 font-medium text-[11px] leading-none">{item.action}</span>
                            </div>
                            </div>
                        </div>
                        );
                    })
                )}
              </div>

              <button 
                className="relative z-10 w-full py-4 bg-white/5 hover:bg-white border border-white/10 text-white/60 hover:text-primary transition-all duration-500 rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl hover:shadow-[#030037]/50 active:scale-95 group font-sans"
                suppressHydrationWarning
              >
                Monitor Semua Log
                <Zap className="w-3 h-3 inline-block ml-2 group-hover:scale-125 transition-transform" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
