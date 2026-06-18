"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const formatShort = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(v) >= 1_000)     return `Rp ${(v / 1_000).toFixed(0)}rb`;
  return `Rp ${v}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#030037] text-white px-5 py-4 rounded-xl shadow-2xl text-xs font-bold border border-white/10">
      <p className="text-white/40 mb-2 text-[10px] uppercase tracking-widest">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.value < 0 ? "#f43f5e" : (p.color || "#fff") }} className="text-sm font-black">
          {p.name.toUpperCase()}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

interface ChartCardProps {
  title: string;
  value: string;
  color: string;
  data: any[];
  dataKey: string | string[];
  icon: React.ReactNode;
  negative?: boolean;
  isProfitLoss?: boolean;
}

const ChartCard = ({ title, value, color, data, dataKey, icon, negative = false, isProfitLoss = false }: ChartCardProps) => {
  const keys     = Array.isArray(dataKey) ? dataKey : [dataKey];
  const allValues = data.flatMap((d) => keys.map((k) => d[k] ?? 0));
  const maxVal    = Math.max(...allValues, 1);

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8 shadow-sm flex flex-col h-[280px] sm:h-[340px] hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group relative overflow-hidden">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-zinc-50 text-zinc-400 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
            {icon}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-1">{title}</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#030037] tracking-tighter leading-none">{value}</h2>
          </div>
        </div>
        <div className={`shrink-0 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
          negative ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
        } shadow-sm self-end xs:self-center`}>
          {negative ? "Pengeluaran" : "Pemasukan"}
        </div>
      </div>

      <div className="w-full">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="gUntung" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRugi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`g-${keys[0]}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#a1a1aa", fontWeight: 800 }} axisLine={{ stroke: "#f1f1f4" }} tickLine={false} dy={8} />
            <YAxis domain={[0, maxVal]} tick={{ fontSize: 9, fill: "#a1a1aa", fontWeight: 800 }} axisLine={{ stroke: "#f1f1f4" }} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`} width={36} />
            <Tooltip content={<CustomTooltip />} />
            {isProfitLoss ? (
              <>
                <Area type="monotone" dataKey="untung" stroke="#10b981" strokeWidth={2.5} fill="url(#gUntung)" />
                <Area type="monotone" dataKey="rugi"   stroke="#f43f5e" strokeWidth={2.5} fill="url(#gRugi)" />
              </>
            ) : (
              <Area type="monotone" dataKey={keys[0]} stroke={color} strokeWidth={2.5} fill={`url(#g-${keys[0]})`} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface ChartsSectionProps {
  summary: {
    totalPendapatan: number;
    totalPengeluaran: number;
    totalSaldo: number;
  } | null;
  charts: {
    pendapatan: { name: string; pendapatan: number }[];
    pengeluaran: { name: string; pengeluaran: number }[];
    saldo: { name: string; saldo: number }[];
  };
  isFiltering: boolean;
}

export default function ChartsSection({ summary, charts, isFiltering }: ChartsSectionProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-300 ease-in-out ${
      isFiltering ? "opacity-40 scale-[0.995]" : "opacity-100 scale-100"
    }`}>
      <ChartCard title="Pendapatan" value={formatShort(summary?.totalPendapatan ?? 0)} color="#10b981" data={charts.pendapatan} dataKey="pendapatan" icon={<TrendingUp className="w-6 h-6" />} />
      <ChartCard title="Pengeluaran" value={formatShort(summary?.totalPengeluaran ?? 0)} color="#f43f5e" data={charts.pengeluaran} dataKey="pengeluaran" icon={<TrendingDown className="w-6 h-6" />} negative />
      <ChartCard title="laba" value={formatShort(summary?.totalSaldo ?? 0)} color="#3c39d6" data={charts.saldo} dataKey="saldo" icon={<Wallet className="w-6 h-6" />} />
    </div>
  );
}
