import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─── 1. GET — Daftar Attachments ─────────────────────────────────────────────
// Query params: group_id, page, limit
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const group_id = searchParams.get("group_id") ?? undefined;
        const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
        const limit    = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 10)));

        const where = {
            ...(group_id && { group_id }),
        };

        const [total, data] = await Promise.all([
            prisma.transaction_attachments.count({ where }),
            prisma.transaction_attachments.findMany({
                where,
                orderBy: { created_at: "desc" },
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
        console.error("GET ATTACHMENTS ERROR:", error);
        return NextResponse.json({ error: "Gagal mengambil data lampiran" }, { status: 500 });
    }
}

// ─── 2. POST — Tambah Attachment ─────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { group_id, file_url } = body;

        if (!group_id) {
            return NextResponse.json({ error: "Group ID wajib disertakan" }, { status: 400 });
        }
        if (!file_url) {
            return NextResponse.json({ error: "URL file wajib disertakan" }, { status: 400 });
        }

        const newAttachment = await prisma.transaction_attachments.create({
            data: {
                group_id,
                file_url,
            },
        });

        return NextResponse.json(newAttachment, { status: 201 });
    } catch (error) {
        console.error("POST ATTACHMENT ERROR:", error);
        return NextResponse.json({ error: "Gagal menyimpan lampiran" }, { status: 500 });
    }
}

// ─── 3. PATCH — Ubah Attachment (pindah group atau ganti URL) ────────────────
export async function PATCH(req: Request) {
    try {
        const { id, ...data } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ID lampiran wajib disertakan" }, { status: 400 });
        }

        const updated = await prisma.transaction_attachments.update({
            where: { id },
            data,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH ATTACHMENT ERROR:", error);
        return NextResponse.json({ error: "Gagal memperbarui lampiran" }, { status: 500 });
    }
}

// ─── 4. DELETE — Hapus Attachment ────────────────────────────────────────────
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID lampiran wajib disertakan" }, { status: 400 });
        }

        await prisma.transaction_attachments.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Lampiran berhasil dihapus" });
    } catch (error) {
        console.error("DELETE ATTACHMENT ERROR:", error);
        return NextResponse.json({ error: "Gagal menghapus lampiran" }, { status: 500 });
    }
}
