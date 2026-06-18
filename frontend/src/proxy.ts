import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/backend"];

const ROLE_PROTECTED_ROUTES: Record<string, string[]> = {
  "/backend/admin": ["ADMIN"],
  "/backend/tenant": ["TENANT", "OWNER", "ADMIN", "UMKM", "STAFF"],
};

const LOGIN_PAGE = "/login";
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/_next",
  "/favicon.ico",
  "/unauthorized",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function getAllowedRoles(pathname: string): string[] | null {
  const matchedKey = Object.keys(ROLE_PROTECTED_ROUTES)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];
  return matchedKey ? ROLE_PROTECTED_ROUTES[matchedKey] : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "POST" && request.headers.get("next-action")) {
    return NextResponse.next();
  }

  if (isPublic(pathname)) return NextResponse.next();
  if (!isProtected(pathname)) return NextResponse.next();

  const token = request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = new URL(LOGIN_PAGE, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoles = getAllowedRoles(pathname);
  if (allowedRoles) {
    const roleCookie = request.cookies.get("role_name")?.value;
    const userRole = roleCookie?.toUpperCase();
    if (!userRole || !allowedRoles.includes(userRole)) {
      const forbiddenUrl = new URL("/unauthorized", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
