import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ============================================================
// KONFIGURASI ROUTE PROTECTION
// ============================================================

// Route yang membutuhkan login saja (role apapun)
const PROTECTED_ROUTES = ["/backend"];

// Route yang HANYA boleh diakses oleh role tertentu
// key: prefix path, value: array role yang diizinkan (UPPERCASE)
const ROLE_PROTECTED_ROUTES: Record<string, string[]> = {
  "/backend/admin": ["ADMIN"],
  "/backend/tenant": ["TENANT", "OWNER", "ADMIN", "UMKM", "STAFF"],
  // Tambahkan mapping baru di sini jika ada role/path baru
  // "/backend/staff": ["STAFF", "ADMIN"],
};

// Halaman login & public (tidak perlu auth)
const LOGIN_PAGE = "/login";
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/_next",
  "/favicon.ico",
];

// ============================================================

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function getAllowedRoles(pathname: string): string[] | null {
  // Cari route yang paling spesifik (paling panjang yang cocok)
  const matchedKey = Object.keys(ROLE_PROTECTED_ROUTES)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];

  return matchedKey ? ROLE_PROTECTED_ROUTES[matchedKey] : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati semua route public
  if (isPublic(pathname)) return NextResponse.next();

  // Hanya proses route yang dilindungi
  if (!isProtected(pathname)) return NextResponse.next();

  const token = request.cookies.get("token")?.value;

  // Belum login → redirect ke /login
  if (!token) {
    const loginUrl = new URL(LOGIN_PAGE, request.url);
    loginUrl.searchParams.set("from", pathname); // simpan tujuan asal
    return NextResponse.redirect(loginUrl);
  }

  // Verifikasi JWT
  let payload: { role_name?: string | null } = {};
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    const { payload: decoded } = await jwtVerify(token, secret);
    payload = decoded as { role_name?: string | null };
  } catch {
    // Token invalid/expired → redirect ke login
    const loginUrl = new URL(LOGIN_PAGE, request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    response.cookies.delete("role_name");
    return response;
  }

  // Cek role jika route memerlukan role tertentu
  const allowedRoles = getAllowedRoles(pathname);
  if (allowedRoles) {
    const userRole = (payload.role_name as string | null)?.toUpperCase();
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Punya token tapi role tidak cocok → 403 redirect
      const forbiddenUrl = new URL("/unauthorized", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan middleware pada semua path kecuali static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
