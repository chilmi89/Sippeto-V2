import React from "react";
import { getTenantDashboardData } from "./actions";
import TenantDashboardClient from "./TenantDashboardClient";

export default async function TenantDashboardPage() {
  const data = await getTenantDashboardData();

  if (data.status === "error" || !data.profile) {
    return (
      <div className="min-h-[60vh] bg-white rounded-2xl border border-zinc-100 flex flex-col items-center justify-center p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-rose-600 mb-2">Gagal Memuat Dashboard</h2>
        <p className="text-sm text-zinc-500 max-w-md">
          {data.message || "Tidak dapat mengambil data profil atau statistik keuangan dari server backend."}
        </p>
      </div>
    );
  }

  return (
    <TenantDashboardClient
      initialProfile={data.profile}
      initialFinancials={data.financials || null}
      branches={data.branches || []}
      userBranchId={data.userBranchId || null}
      initialBranchId={data.initialBranchId || "all"}
    />
  );
}