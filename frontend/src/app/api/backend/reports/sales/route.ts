import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        
        const profile_id = searchParams.get("profile_id");
        const branch_id = searchParams.get("branch_id") || undefined;
        // type: 'daily' | 'weekly' | 'monthly' | 'yearly'
        const type = searchParams.get("type") || "daily"; 
        const date_start = searchParams.get("date_start");
        const date_end = searchParams.get("date_end");

        if (!profile_id) {
            return NextResponse.json({ error: "Profile ID wajib disertakan" }, { status: 400 });
        }

        const where: any = { profile_id };
        if (branch_id && branch_id !== "all") {
            where.branch_id = branch_id;
        }
        
        if (date_start || date_end) {
            where.transaction_date = {};
            if (date_start) where.transaction_date.gte = new Date(date_start);
            if (date_end) where.transaction_date.lte = new Date(date_end);
        }

        // Ambil data mentah yang relevan
        const transactions = await prisma.transaction_groups.findMany({
            where,
            orderBy: { transaction_date: "asc" },
            select: { 
                transaction_date: true, 
                total_income: true, 
                total_expense: true, 
                net_balance: true 
            }
        });

        // ─── Proses Grouping Menggunakan JavaScript ──────────────────────────────
        const groupedData: Record<string, { 
            period: string; 
            total_income: number; 
            total_expense: number; 
            net_balance: number; 
        }> = {};

        // Helper untuk memformat penamaan kunci (key) berdasarkan tipe laporan
        const getPeriodKey = (date: Date, type: string) => {
            const d = new Date(date);
            const year = d.getFullYear();
            
            if (type === "daily") {
                // Format: YYYY-MM-DD
                return d.toISOString().split("T")[0];
            } else if (type === "weekly") {
                // Menghitung minggu ke berapa dalam satu tahun (ISO week logic basic)
                const firstDayOfYear = new Date(year, 0, 1);
                const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
                const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                return `${year}-W${weekNum.toString().padStart(2, '0')}`;
            } else if (type === "monthly") {
                // Format: YYYY-MM
                return `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            } else if (type === "yearly") {
                // Format: YYYY
                return `${year}`;
            }
            
            return d.toISOString().split("T")[0];
        };

        const summary = {
            total_income: 0,
            total_expense: 0,
            net_balance: 0
        };

        // Pre-fill periode (membuat titik kosong menjadi 0, sehingga grafik tidak berbentuk garis lurus antara 2 tanggal berjauhan)
        const today = new Date();
        if (type === "daily") {
            // Pre-fill 7 hari terakhir
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const period = getPeriodKey(d, type);
                groupedData[period] = { period, total_income: 0, total_expense: 0, net_balance: 0 };
            }
        } else if (type === "weekly") {
            // Pre-fill 5 minggu terakhir
            for (let i = 4; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - (i * 7));
                const period = getPeriodKey(d, type);
                groupedData[period] = { period, total_income: 0, total_expense: 0, net_balance: 0 };
            }
        } else if (type === "monthly") {
            // Pre-fill 12 bulan di tahun ini
            for (let i = 0; i < 12; i++) {
                const d = new Date(today.getFullYear(), i, 1);
                const period = getPeriodKey(d, type);
                groupedData[period] = { period, total_income: 0, total_expense: 0, net_balance: 0 };
            }
        } else if (type === "yearly") {
            // Pre-fill 5 tahun terakhir
            for (let i = 4; i >= 0; i--) {
                const d = new Date(today.getFullYear() - i, 0, 1);
                const period = getPeriodKey(d, type);
                groupedData[period] = { period, total_income: 0, total_expense: 0, net_balance: 0 };
            }
        }

        transactions.forEach(tx => {
            if (!tx.transaction_date) return;
            
            const period = getPeriodKey(tx.transaction_date, type);
            
            if (!groupedData[period]) {
                groupedData[period] = { 
                    period, 
                    total_income: 0, 
                    total_expense: 0, 
                    net_balance: 0 
                };
            }

            // Pastikan data di-convert ke Number dengan aman
            const income = Number(tx.total_income || 0);
            const expense = Number(tx.total_expense || 0);
            const net = Number(tx.net_balance || 0);

            // Akumulasi data per periode
            groupedData[period].total_income += income;
            groupedData[period].total_expense += expense;
            groupedData[period].net_balance += net;

            // Akumulasi data keseluruhan (summary)
            summary.total_income += income;
            summary.total_expense += expense;
            summary.net_balance += net;
        });

        // Ubah object hasil grouping jadi Array agar mudah di-map di frontend, urutkan berdasarkan periode
        const data = Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));

        return NextResponse.json({ 
            data, 
            summary,
            type 
        });

    } catch (error) {
        console.error("GET REPORTS ERROR:", error);
        return NextResponse.json({ error: "Gagal memproses data laporan penjualan" }, { status: 500 });
    }
}
