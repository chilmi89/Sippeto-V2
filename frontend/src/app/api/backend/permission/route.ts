import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all permissions
export async function GET() {
  try {
    const permissions = await prisma.permissions.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(permissions);
  } catch (error) {
    console.error("GET PERMISSIONS ERROR:", error);
    return NextResponse.json({ error: "Gagal mengambil data izin" }, { status: 500 });
  }
}

// POST create a new permission
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama izin wajib diisi" }, { status: 400 });
    }

    const newPermission = await prisma.permissions.create({
      data: {
        name,
      },
    });

    return NextResponse.json(newPermission, { status: 201 });
  } catch (error: any) {
    console.error("POST PERMISSION ERROR:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nama izin sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal membuat izin baru" }, { status: 500 });
  }
}
