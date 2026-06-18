import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8080/api";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token tidak ditemukan." },
        { status: 401 },
      );
    }

    const res = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Refresh token tidak valid atau expired." },
        { status: 401 },
      );
    }

    const data = await res.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token tidak ditemukan dalam response." },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ access_token: accessToken });

    response.cookies.set("token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui token." },
      { status: 500 },
    );
  }
}
