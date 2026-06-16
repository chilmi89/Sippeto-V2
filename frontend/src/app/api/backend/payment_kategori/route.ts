import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─── 1. GET - Ambil payment methods dengan pagination & filter ────────────────
// Query params: page (default 1), limit (default 10), search, profile_id, is_active
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const page       = Math.max(1, Number(searchParams.get("page")  ?? 1));
        const limit      = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 10)));
        const search     = searchParams.get("search")     ?? undefined;
        const profile_id = searchParams.get("profile_id") ?? undefined;
        const is_active  = searchParams.get("is_active");

        const where: any = {
            ...(profile_id ? {
                OR: [
                    { profile_id: profile_id },
                    { profile_id: null }
                ]
            } : {}),
            ...(search                && { name: { contains: search, mode: "insensitive" as const } }),
            ...(is_active !== null    && is_active !== undefined && { is_active: is_active === "true" }),
        };

        // Jalankan count & data secara paralel untuk efisiensi
        const [total, data] = await Promise.all([
            prisma.payment_methods.count({ where }),
            prisma.payment_methods.findMany({
                where,
                orderBy: { name: "asc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return NextResponse.json({
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("GET PAYMENT METHODS ERROR:", error);
        return NextResponse.json({ error: "Gagal mengambil data metode pembayaran" }, { status: 500 });
    }
}

// ─── 2. POST - Buat Payment Method Baru ──────────────────────────────────────
// profile_id opsional — null berarti metode pembayaran global
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, profile_id, is_active } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: "Nama metode pembayaran wajib diisi" }, { status: 400 });
        }

        const paymentMethod = await prisma.payment_methods.create({
            data: {
                name:       name.trim(),
                profile_id: profile_id ?? null,
                is_active:  is_active  ?? true,
            },
        });

        return NextResponse.json(paymentMethod, { status: 201 });
    } catch (error: any) {
        // Unique constraint: profile_id + name
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "Metode pembayaran dengan nama ini sudah ada" }, { status: 409 });
        }
        console.error("POST PAYMENT METHOD ERROR:", error);
        return NextResponse.json({ error: "Gagal menyimpan metode pembayaran" }, { status: 500 });
    }
}

// ─── 3. PATCH - Edit Payment Method ──────────────────────────────────────────
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, name, is_active } = body;

        if (!id) {
            return NextResponse.json({ error: "ID metode pembayaran wajib disertakan" }, { status: 400 });
        }

        const updated = await prisma.payment_methods.update({
            where: { id },
            data: {
                ...(name      !== undefined && { name: name.trim() }),
                ...(is_active !== undefined && { is_active }),
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Metode pembayaran tidak ditemukan" }, { status: 404 });
        }
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "Nama sudah digunakan" }, { status: 409 });
        }
        console.error("PATCH PAYMENT METHOD ERROR:", error);
        return NextResponse.json({ error: "Gagal memperbarui metode pembayaran" }, { status: 500 });
    }
}

// ─── 4. DELETE - Hapus Payment Method ────────────────────────────────────────
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID metode pembayaran tidak ditemukan" }, { status: 400 });
        }

        await prisma.payment_methods.delete({ where: { id } });

        return NextResponse.json({ message: "Metode pembayaran berhasil dihapus" });
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Metode pembayaran tidak ditemukan" }, { status: 404 });
        }
        // Jika masih digunakan oleh transaction_items
        if (error?.code === "P2003") {
            return NextResponse.json(
                { error: "Tidak bisa dihapus — metode ini masih digunakan pada transaksi" },
                { status: 409 }
            );
        }
        console.error("DELETE PAYMENT METHOD ERROR:", error);
        return NextResponse.json({ error: "Gagal menghapus metode pembayaran" }, { status: 500 });
    }
}
