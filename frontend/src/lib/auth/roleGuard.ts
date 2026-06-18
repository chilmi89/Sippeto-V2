export type AllowedRoles = string[];

export const ROLE_ACCESS: Record<string, AllowedRoles> = {
  "/backend/admin": ["SUPERADMIN", "ADMIN"],
  "/backend/tenant": ["TENANT", "OWNER", "STAFF", "UMKM"],
};

export function getRoleFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)role_name=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function hasAccess(pathname: string, role: string | null): boolean {
  if (!role) return false;
  const upperRole = role.toUpperCase();

  for (const [prefix, allowed] of Object.entries(ROLE_ACCESS)) {
    if (pathname.startsWith(prefix)) {
      return allowed.includes(upperRole);
    }
  }

  return true;
}
