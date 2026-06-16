import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─── 1. GET — Daftar Transaction Items ─────────────────────────────────────────
// Query params: group_id, category_id, type (pemasukan | pengeluaran), page, limit
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const group_id    = searchParams.get("group_id") ?? undefined;
        const category_id = searchParams.get("category_id") ?? undefined;
        const type        = searchParams.get("type") ?? undefined;
        const page        = Math.max(1, Number(searchParams.get("page") ?? 1));
        const limit       = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 10)));

        const where = {
            ...(group_id && { group_id }),
            ...(category_id && { category_id }),
            ...(type && { type }),
        };

        const [total, data] = await Promise.all([
            prisma.transaction_items.count({ where }),
            prisma.transaction_items.findMany({
                where,
                orderBy: { created_at: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    categories: true,
                    payment_methods: true
                }
            }),
        ]);

        return NextResponse.json({
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("GET TRANSACTION ITEMS ERROR:", error);
        return NextResponse.json({ error: "Gagal mengambil data item transaksi" }, { status: 500 });
    }
}

// Helper untuk mapping type sesuai constraint database (INCOME / EXPENSE)
const mapType = (t: string) => {
    const low = t.toLowerCase();
    if (low === "pemasukan" || low === "income") return "INCOME";
    if (low === "pengeluaran" || low === "expense") return "EXPENSE";
    return t.toUpperCase();
};

// Helper: Update totals di group_id tertentu
async function updateGroupTotals(group_id: string) {
    // Ambil semua item dalam group ini
    const items = await prisma.transaction_items.findMany({
        where: { group_id },
    });

    let total_income = 0;
    let total_expense = 0;

    items.forEach((item: any) => {
        const amount = Number(item.amount || 0);
        const mappedType = mapType(item.type);
        if (mappedType === "INCOME") total_income += amount;
        if (mappedType === "EXPENSE") total_expense += amount;
    });

// ... (rest of function)
    const net_balance = total_income - total_expense;

    await prisma.transaction_groups.update({
        where: { id: group_id },
        data: {
            total_income,
            total_expense,
            net_balance,
        },
    });
}

// ─── 2. POST — Tambah Transaction Item ────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { group_id, category_id, payment_method_id, type, name, amount } = body;

        if (!group_id) {
            return NextResponse.json({ error: "Group ID wajib disertakan" }, { status: 400 });
        }

        const newItem = await prisma.transaction_items.create({
            data: {
                group_id,
                category_id,
                payment_method_id,
                type: mapType(type),
                name,
                amount,
            },
        });

        // Recalculate group totals
        await updateGroupTotals(group_id);

        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        console.error("POST TRANSACTION ITEM ERROR:", error);
        return NextResponse.json({ error: "Gagal membuat item transaksi" }, { status: 500 });
    }
}

// ─── 3. PATCH — Ubah Item ────────────────────────────────────────────────────
export async function PATCH(req: Request) {
    try {
        const { id, ...data } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ID item wajib disertakan" }, { status: 400 });
        }

        const currentItem = await prisma.transaction_items.findUnique({
            where: { id },
            select: { group_id: true }
        });

        const updated = await prisma.transaction_items.update({
            where: { id },
            data,
        });

        // Recalculate group totals if group exists
        if (currentItem?.group_id) {
            await updateGroupTotals(currentItem.group_id);
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH TRANSACTION ITEM ERROR:", error);
        return NextResponse.json({ error: "Gagal memperbarui item transaksi" }, { status: 500 });
    }
}

// ─── 4. DELETE — Hapus Item ───────────────────────────────────────────────────
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID item wajib disertakan" }, { status: 400 });
        }

        const currentItem = await prisma.transaction_items.findUnique({
            where: { id },
            select: { group_id: true }
        });

        await prisma.transaction_items.delete({
            where: { id },
        });

        // Recalculate group totals if group exists
        if (currentItem?.group_id) {
            await updateGroupTotals(currentItem.group_id);
        }

        return NextResponse.json({ message: "Item transaksi berhasil dihapus" });
    } catch (error) {
        console.error("DELETE TRANSACTION ITEM ERROR:", error);
        return NextResponse.json({ error: "Gagal menghapus item transaksi" }, { status: 500 });
    }
}
