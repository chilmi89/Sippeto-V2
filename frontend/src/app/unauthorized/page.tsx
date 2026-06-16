"use client";

import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-zinc-100 shadow-2xl shadow-zinc-200/40 p-10 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-rose-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-800 tracking-tight">Akses Ditolak</h1>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Anda tidak memiliki izin untuk mengakses halaman ini.
            Silakan hubungi administrator jika ini adalah kesalahan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Link>
        </div>

        <p className="text-[11px] text-zinc-400 font-medium">
          Kode Error: <span className="font-bold text-zinc-600">403 FORBIDDEN</span>
        </p>
      </div>
    </div>
  );
}
