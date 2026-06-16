import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.profiles.findMany({
      include: {
        roles: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Menghilangkan password filter agar tidak diekspos ke frontend
    const usersWithoutPassword = users.map((user) => {
      const { password, ...rest } = user;
      return rest;
    });

    return NextResponse.json({ data: usersWithoutPassword }, { status: 200 });
  } catch (error: any) {
    console.error("GET Users Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data users" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
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

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, password, dan nama wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await prisma.profiles.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.profiles.create({
      data: {
        email,
        password: hashedPassword,
        full_name,
        role_id,
        business_name,
        phone_number,
        is_active: is_active ?? true,
        branch_id: branch_id ?? null,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { data: userWithoutPassword, message: "User berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST User Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat user" },
      { status: 500 }
    );
  }
}
