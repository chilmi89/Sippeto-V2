import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET a single role by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params;
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Peran tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error("GET SINGLE ROLE ERROR:", error);
    return NextResponse.json({ error: "Gagal mengambil detail peran" }, { status: 500 });
  }
}

// PATCH update a role by ID
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama peran tidak boleh kosong" }, { status: 400 });
    }

    const updatedRole = await prisma.roles.update({
      where: { id: roleId },
      data: { name },
    });

    return NextResponse.json(updatedRole);
  } catch (error: any) {
    console.error("PATCH ROLE ERROR:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nama peran sudah digunakan" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal memperbarui peran" }, { status: 500 });
  }
}

// DELETE a role by ID
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params;
    
    await prisma.roles.delete({
      where: { id: roleId },
    });

    return NextResponse.json({ message: "Peran berhasil dihapus" });
  } catch (error) {
    console.error("DELETE ROLE ERROR:", error);
    return NextResponse.json({ error: "Gagal menghapus peran" }, { status: 500 });
  }
}
