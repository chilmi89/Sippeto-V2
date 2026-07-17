import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Custom autoTable types helper
type AutoTableType = typeof autoTable;

const GOLANG_BASE = process.env.BACKEND_API_URL || "http://localhost:8080/api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "daily";
    const format = searchParams.get("format") || "excel";
    const selectedBranchId = searchParams.get("branch_id") || "all";

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    // 1. Ambil profile/tenant info dari Golang
    const profileRes = await fetch(`${GOLANG_BASE}/tenant-umkm`, {
      method: "GET",
      headers,
    });
    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "Gagal memuat profil bisnis dari server Go" },
        { status: profileRes.status }
      );
    }
    const profileData = await profileRes.json();
    const profile = profileData.profile;
    if (!profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
    }

    // Tentukan tenantOwnerId & userBranchId
    const userBranchId = profile.branch_id || null;
    const activeBranchId = userBranchId ? userBranchId : selectedBranchId;

    // 2. Ambil nama cabang dari Golang jika bukan "all"
    let branchName = "Semua Cabang";
    if (activeBranchId !== "all") {
      const branchesRes = await fetch(`${GOLANG_BASE}/branches`, {
        method: "GET",
        headers,
      });
      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        const branches = branchesData.data || [];
        const branchObj = branches.find((b: any) => b.id === activeBranchId);
        if (branchObj) {
          branchName = branchObj.name;
        }
      }
    }

    // 3. Ambil data penjualan dari Golang
    const query = new URLSearchParams({
      type,
      branch_id: activeBranchId,
    });
    const reportRes = await fetch(`${GOLANG_BASE}/reports/sales?${query.toString()}`, {
      method: "GET",
      headers,
    });
    if (!reportRes.ok) {
      return NextResponse.json(
        { error: "Gagal memuat laporan penjualan dari server Go" },
        { status: reportRes.status }
      );
    }
    const reportDataJson = await reportRes.json();
    const reportData = reportDataJson.data || [];
    const summary = reportDataJson.summary || { total_income: 0, total_expense: 0, net_balance: 0 };

    const titleMap: Record<string, string> = {
      daily: "Laporan Penjualan Harian",
      weekly: "Laporan Penjualan Mingguan",
      monthly: "Laporan Penjualan Bulanan",
      yearly: "Laporan Penjualan Tahunan",
    };
    const title = titleMap[type] || "Laporan Penjualan";

    if (format === "excel") {
      const sheetData = reportData.map((row: any) => ({
        Periode: row.period,
        "Total Pemasukan": row.total_income,
        "Total Pengeluaran": row.total_expense,
        "Saldo Bersih": row.net_balance,
      }));

      sheetData.push({
        Periode: "TOTAL",
        "Total Pemasukan": summary.total_income,
        "Total Pengeluaran": summary.total_expense,
        "Saldo Bersih": summary.net_balance,
      });

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      const fileName = `Laporan_${type}_${branchName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;

      return new Response(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    } else if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(11);
      doc.text(`Tipe Laporan: ${type.toUpperCase()}`, 14, 30);
      doc.text(`Cabang: ${branchName}`, 14, 36);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`, 14, 42);

      const tableColumn = ["Periode", "Total Pemasukan", "Total Pengeluaran", "Saldo Bersih"];
      const tableRows = reportData.map((row: any) => [
        row.period,
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(row.total_income),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(row.total_expense),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(row.net_balance),
      ]);

      tableRows.push([
        "TOTAL",
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.total_income),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.total_expense),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.net_balance),
      ]);

      (autoTable as unknown as AutoTableType)(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 48,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [3, 0, 55] },
      });

      const pdfOutput = doc.output("arraybuffer");
      const fileName = `Laporan_${type}_${branchName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

      return new Response(pdfOutput, {
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": "application/pdf",
        },
      });
    }

    return NextResponse.json({ error: "Format tidak didukung" }, { status: 400 });
  } catch (error) {
    console.error("Server Export Error:", error);
    return NextResponse.json({ error: "Gagal mengekspor laporan" }, { status: 500 });
  }
}
