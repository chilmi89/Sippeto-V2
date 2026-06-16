import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET permissions for a specific role or all mappings
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("role_id");

    if (roleId) {
      const permissions = await prisma.role_permissions.findMany({
        where: {
          role_id: roleId,
        },
        include: {
          permissions: true,
        },
      });
      return NextResponse.json(permissions);
    }

    const allMappings = await prisma.role_permissions.findMany({
      include: {
        roles: true,
        permissions: true,
      },
    });
    return NextResponse.json(allMappings);
  } catch (error) {
    console.error("GET ROLE PERMISSIONS ERROR:", error);
    return NextResponse.json({ error: "Gagal mengambil data izin peran" }, { status: 500 });
  }
}

// POST: Add permission to a role
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role_id, permission_id } = body;

    if (!role_id || !permission_id) {
      return NextResponse.json({ error: "ID Peran dan ID Izin wajib diisi" }, { status: 400 });
    }

    const assignment = await prisma.role_permissions.upsert({
      where: {
        role_id_permission_id: {
          role_id,
          permission_id,
        },
      },
      update: {}, // No changes if already exists
      create: {
        role_id,
        permission_id,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("POST ROLE PERMISSION ERROR:", error);
    return NextResponse.json({ error: "Gagal memberikan izin ke peran" }, { status: 500 });
  }
}

// DELETE: Remove permission from a role
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { role_id, permission_id } = body;

    if (!role_id || !permission_id) {
      return NextResponse.json({ error: "ID Peran dan ID Izin wajib diisi" }, { status: 400 });
    }

    await prisma.role_permissions.delete({
      where: {
        role_id_permission_id: {
          role_id,
          permission_id,
        },
      },
    });

    return NextResponse.json({ message: "Izin berhasil dihapus dari peran" });
  } catch (error) {
    console.error("DELETE ROLE PERMISSION ERROR:", error);
    return NextResponse.json({ error: "Gagal menghapus izin dari peran" }, { status: 500 });
  }
}
