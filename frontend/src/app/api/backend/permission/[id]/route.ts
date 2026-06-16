import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET a single permission by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: permissionId } = await params;
    const permission = await prisma.permissions.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return NextResponse.json({ error: "Izin tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(permission);
  } catch (error) {
    console.error("GET SINGLE PERMISSION ERROR:", error);
    return NextResponse.json({ error: "Gagal mengambil detail izin" }, { status: 500 });
  }
}

// PATCH update a permission by ID
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: permissionId } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama izin tidak boleh kosong" }, { status: 400 });
    }

    const updatedPermission = await prisma.permissions.update({
      where: { id: permissionId },
      data: { name },
    });

    return NextResponse.json(updatedPermission);
  } catch (error: any) {
    console.error("PATCH PERMISSION ERROR:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nama izin sudah digunakan" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal memperbarui izin" }, { status: 500 });
  }
}

// DELETE a permission by ID
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: permissionId } = await params;
    
    await prisma.permissions.delete({
      where: { id: permissionId },
    });

    return NextResponse.json({ message: "Izin berhasil dihapus" });
  } catch (error) {
    console.error("DELETE PERMISSION ERROR:", error);
    return NextResponse.json({ error: "Gagal menghapus izin" }, { status: 500 });
  }
}
