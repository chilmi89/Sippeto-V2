import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all roles
export async function GET() {
  try {
    const roles = await prisma.roles.findMany({
      include: {
        _count: {
          select: { role_permissions: true }
        }
      },
      orderBy: {
        created_at: "desc",
      },
    });
    return NextResponse.json(roles);
  } catch (error) {
    console.error("GET ROLES ERROR:", error);
    return NextResponse.json({ error: "Gagal mengambil data peran" }, { status: 500 });
  }
}

// POST create a new role
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama peran wajib diisi" }, { status: 400 });
    }

    const newRole = await prisma.roles.create({
      data: {
        name,
      },
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error: any) {
    console.error("POST ROLE ERROR:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nama peran sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal membuat peran baru" }, { status: 500 });
  }
}