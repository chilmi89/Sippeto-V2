"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Calendar, BarChart2, Clock } from "lucide-react";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const formatShort = (v: number) => formatCurrency(v);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#030037] text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold border border-white/10">
      <p className="text-white/40 mb-1.5 text-[10px] uppercase tracking-widest">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.value < 0 ? "#f43f5e" : (p.color || "#fff") }} className="text-xs font-black">
          {(p.name || "").toUpperCase()}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

interface ChartCardProps {
  title: string;
  value: string;
  badgeText: string;
  color: string;
  data: any[];
  dataKey: string;
  icon: React.ReactNode;
  negative?: boolean;
}

const ChartCard = ({
  title,
  value,
  badgeText,
  color,
  data,
  dataKey,
  icon,
  negative = false,
}: ChartCardProps) => {
  const allValues = data.map((d) => Number(d[dataKey] ?? 0));
  const maxVal = Math.max(...allValues, 1);

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 sm:p-6 shadow-sm flex flex-col h-[300px] sm:h-[340px] hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group relative overflow-hidden">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-zinc-50 text-zinc-400 rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
            {icon}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 block mb-0.5">{title}</span>
            <h2 className="text-lg sm:text-xl font-bold text-[#030037] tracking-tighter leading-none">{value}</h2>
          </div>
        </div>
        <div
          className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
            negative ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
          } shadow-xs self-end xs:self-center`}
        >
          {badgeText}
        </div>
      </div>

      <div className="w-full flex-1 min-h-[170px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${title.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: "#a1a1aa", fontWeight: 800 }}
              axisLine={{ stroke: "#f1f1f4" }}
              tickLine={false}
              dy={6}
            />
            <YAxis
              domain={[0, maxVal]}
              tick={{ fontSize: 9, fill: "#a1a1aa", fontWeight: 800 }}
              axisLine={{ stroke: "#f1f1f4" }}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(0)}jt`
                  : v >= 1_000
                  ? `${(v / 1_000).toFixed(0)}rb`
                  : `${v}`
              }
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              name={title}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#g-${title.replace(/\s+/g, "")})`}
            />
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
    totalHariIni?: number;
    totalMingguIni?: number;
    totalBulanIni?: number;
  } | null;
  charts: {
    pendapatan: { name: string; pendapatan: number }[];
    pengeluaran: { name: string; pengeluaran: number }[];
    saldo: { name: string; saldo: number }[];
    hariIni?: { name: string; pendapatan: number }[];
    mingguIni?: { name: string; pendapatan: number }[];
    bulanIni?: { name: string; pendapatan: number }[];
  };
  isFiltering: boolean;
}

export default function ChartsSection({ summary, charts, isFiltering }: ChartsSectionProps) {
  const totalInc = summary?.totalPendapatan ?? 0;
  const totalExp = summary?.totalPengeluaran ?? 0;
  const netBal = summary?.totalSaldo ?? (totalInc - totalExp);
  const totalHariIni = summary?.totalHariIni ?? 0;
  const totalMingguIni = summary?.totalMingguIni ?? 0;
  const totalBulanIni = summary?.totalBulanIni ?? 0;

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ease-in-out ${
        isFiltering ? "opacity-40 scale-[0.995]" : "opacity-100 scale-100"
      }`}
    >
      {/* 1. Grafik Hari Ini (Paling Atas) */}
      <ChartCard
        title="Hari Ini"
        value={formatShort(totalHariIni)}
        badgeText="Hari Ini"
        color="#06b6d4"
        data={charts.hariIni || []}
        dataKey="pendapatan"
        icon={<Calendar className="w-5 h-5" />}
      />

      {/* 2. Grafik Minggu Ini (Paling Atas) */}
      <ChartCard
        title="Minggu Ini"
        value={formatShort(totalMingguIni)}
        badgeText="Minggu Ini"
        color="#8b5cf6"
        data={charts.mingguIni || []}
        dataKey="pendapatan"
        icon={<BarChart2 className="w-5 h-5" />}
      />

      {/* 3. Grafik Bulan Ini (Paling Atas) */}
      <ChartCard
        title="Bulan Ini"
        value={formatShort(totalBulanIni)}
        badgeText="Bulan Ini"
        color="#f59e0b"
        data={charts.bulanIni || []}
        dataKey="pendapatan"
        icon={<Clock className="w-5 h-5" />}
      />

      {/* 4. Grafik Pendapatan Total (Bawah) */}
      <ChartCard
        title="Pendapatan Total"
        value={formatShort(totalInc)}
        badgeText="Pemasukan"
        color="#10b981"
        data={charts.pendapatan || []}
        dataKey="pendapatan"
        icon={<TrendingUp className="w-5 h-5" />}
      />

      {/* 5. Grafik Pengeluaran Total (Bawah) */}
      <ChartCard
        title="Pengeluaran Total"
        value={formatShort(totalExp)}
        badgeText="Pengeluaran"
        color="#f43f5e"
        data={charts.pengeluaran || []}
        dataKey="pengeluaran"
        icon={<TrendingDown className="w-5 h-5" />}
        negative
      />

      {/* 6. Grafik Laba Bersih (Bawah) */}
      <ChartCard
        title="Laba Bersih"
        value={formatShort(netBal)}
        badgeText="Saldo / Laba"
        color="#3b82f6"
        data={charts.saldo || []}
        dataKey="saldo"
        icon={<Wallet className="w-5 h-5" />}
      />
    </div>
  );
}

