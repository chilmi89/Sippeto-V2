import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.profiles.findUnique({
      where: { id },
      include: { roles: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({ data: userWithoutPassword }, { status: 200 });
  } catch (error: any) {
    console.error("GET User ID Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      email,
      password,
      full_name,
      role_id,
      business_name,
      phone_number,
      is_active,
      branch_id,
    } = body;

    const existing = await prisma.profiles.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const updateData: any = {
      full_name,
      role_id,
      business_name,
      phone_number,
      is_active,
      branch_id: branch_id ?? null,
    };

    if (email && email !== existing.email) {
      const emailCheck = await prisma.profiles.findUnique({ where: { email } });
      if (emailCheck) {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh user lain" },
          { status: 400 }
        );
      }
      updateData.email = email;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.profiles.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updated;

    return NextResponse.json(
      { data: userWithoutPassword, message: "User berhasil diperbarui" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT User Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.profiles.delete({ where: { id } });
    return NextResponse.json(
      { message: "User berhasil dihapus" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE User Error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus user" },
      { status: 500 }
    );
  }
}
