import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

// ─── Helper: decode JWT & get profile_id ─────────────────────────────────────

async function getProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, secret) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

// ─── Helper: format month label ───────────────────────────────────────────────

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

// ─── 1. GET — Profile UMKM + Ringkasan Keuangan Tahunan ──────────────────────
// Returns: { profile, financials: { saldo, pendapatan, pengeluaran, labaRugi } }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch_id = searchParams.get("branch_id") || undefined;

    const profile_id = await getProfileId();
    if (!profile_id) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const currentYear = new Date().getFullYear();

    // 1. Ambil profile terlebih dahulu
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: {
        id: true,
        full_name: true,
        business_name: true,
        email: true,
        phone_number: true,
        address: true,
        avatar_url: true,
        bio: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        branch_id: true,
        username: true,
        roles: {
          select: { name: true }
        }
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
    }

    // Tentukan tenantOwnerId (ID Owner Utama) dan paksa filter branch jika user adalah staf cabang
    let tenantOwnerId = profile.id;
    let forcedBranchId = branch_id;

    if (profile.branch_id) {
      const branch = await prisma.branches.findUnique({
        where: { id: profile.branch_id },
        select: { tenant_id: true }
      });
      if (branch) {
        tenantOwnerId = branch.tenant_id;
      }
      forcedBranchId = profile.branch_id;
    }

    const txWhere: any = {
      profile_id: tenantOwnerId,
      transaction_date: {
        gte: new Date(`${currentYear}-01-01`),
        lte: new Date(`${currentYear}-12-31`),
      },
    };

    if (forcedBranchId && forcedBranchId !== "all") {
      txWhere.branch_id = forcedBranchId;
    }

    // Ambil transaction_groups secara paralel
    const txGroups = await prisma.transaction_groups.findMany({
      where: txWhere,
      select: {
        transaction_date: true,
        total_income: true,
        total_expense: true,
        net_balance: true,
      },
      orderBy: { transaction_date: "asc" },
    });

    // ── Agregasi per bulan ───────────────────────────────────────────────────
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      name: MONTH_LABELS[i],
      pendapatan: 0,
      pengeluaran: 0,
      saldo: 0,
    }));

    for (const tx of txGroups) {
      const month = new Date(tx.transaction_date!).getMonth(); // 0-indexed
      monthly[month].pendapatan  += Number(tx.total_income  ?? 0);
      monthly[month].pengeluaran += Number(tx.total_expense ?? 0);
      monthly[month].saldo       += Number(tx.net_balance   ?? 0);
    }

    // Saldo akumulatif (running total)
    let runningBalance = 0;
    const saldoData = monthly.map((m) => {
      runningBalance += m.saldo;
      return { name: m.name, saldo: runningBalance };
    });

    // Laba-rugi per bulan
    const labaRugiData = monthly.map((m) => ({
      name: m.name,
      untung: m.pendapatan,
      rugi:   m.pengeluaran,
    }));

    // ── Summary totals ────────────────────────────────────────────────────────
    const totalPendapatan  = monthly.reduce((s, m) => s + m.pendapatan, 0);
    const totalPengeluaran = monthly.reduce((s, m) => s + m.pengeluaran, 0);
    const totalSaldo       = runningBalance;

    return NextResponse.json({
      profile: {
        ...profile,
        tenant_owner_id: tenantOwnerId
      },
      financials: {
        summary: {
          totalPendapatan,
          totalPengeluaran,
          totalSaldo,
          netProfit: totalPendapatan - totalPengeluaran,
        },
        charts: {
          saldo:       saldoData,
          pendapatan:  monthly.map((m) => ({ name: m.name, pendapatan: m.pendapatan })),
          pengeluaran: monthly.map((m) => ({ name: m.name, pengeluaran: m.pengeluaran })),
          labaRugi:    labaRugiData,
        },
      },
    });

  } catch (error) {
    console.error("GET TENANT UMKM ERROR:", error);
    return NextResponse.json({ error: "Gagal mengambil data profil" }, { status: 500 });
  }
}

// ─── 2. PATCH — Update Profile UMKM ──────────────────────────────────────────

export async function PATCH(req: Request) {
  try {
    const profile_id = await getProfileId();
    if (!profile_id) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, business_name, phone_number, address, bio, avatar_url, banner_url } = body;

    const updated = await prisma.profiles.update({
      where: { id: profile_id },
      data: {
        ...(full_name     !== undefined && { full_name }),
        ...(business_name !== undefined && { business_name }),
        ...(phone_number  !== undefined && { phone_number }),
        ...(address       !== undefined && { address }),
        ...(bio           !== undefined && { bio }),
        ...(avatar_url    !== undefined && { avatar_url }),
        ...(banner_url    !== undefined && { banner_url }),
        updated_at: new Date(),
      },
      select: {
        id: true,
        full_name: true,
        business_name: true,
        phone_number: true,
        address: true,
        bio: true,
        avatar_url: true,
        updated_at: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH TENANT UMKM ERROR:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}
