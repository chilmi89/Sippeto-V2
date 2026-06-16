import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 1. GET - Ambil kategori dengan pagination & filter
// Query params: page (default 1), limit (default 10), type, search, profile_id
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const page       = Math.max(1, Number(searchParams.get("page")  ?? 1));
        const limit      = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 10)));
        const type       = searchParams.get("type") ?? undefined;
        const search     = searchParams.get("search") ?? undefined;
        const profile_id = searchParams.get("profile_id") ?? undefined;

        const where = {
            ...(profile_id && { profile_id }),
            ...(type       && { type }),
            ...(search     && { name: { contains: search, mode: "insensitive" as const } }),
        };

        // Jalankan count & data secara paralel untuk efisiensi
        const [total, data] = await Promise.all([
            prisma.categories.count({ where }),
            prisma.categories.findMany({
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
        console.error("GET CATEGORIES ERROR:", error);
        return NextResponse.json({ error: "Gagal mengambil data kategori" }, { status: 500 });
    }
}

// 2. POST - Buat Kategori Baru
// profile_id bersifat opsional — jika tidak dikirim, kategori disimpan sebagai global (null)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, type, profile_id } = body;

        if (!name || !type) {
            return NextResponse.json({ error: "Nama dan Tipe wajib diisi" }, { status: 400 });
        }

        const category = await prisma.categories.create({
            data: {
                name,
                type: type.toLowerCase(), // 'pemasukan' atau 'pengeluaran'
                profile_id: profile_id ?? null,
            }
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("POST CATEGORY ERROR:", error);
        return NextResponse.json({ error: "Gagal menyimpan kategori" }, { status: 500 });
    }
}

// 3. PATCH - Edit Kategori
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, name, type } = body;

        if (!id) return NextResponse.json({ error: "ID kategori wajib disertakan" }, { status: 400 });

        const updated = await prisma.categories.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(type && { type: type.toLowerCase() })
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH CATEGORY ERROR:", error);
        return NextResponse.json({ error: "Gagal memperbarui kategori" }, { status: 500 });
    }
}

// 4. DELETE - Hapus Kategori
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID kategori tidak ditemukan" }, { status: 400 });

        await prisma.categories.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Kategori berhasil dihapus" });
    } catch (error) {
        console.error("DELETE CATEGORY ERROR:", error);
        return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
    }
}