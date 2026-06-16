/**
 * ============================================================
 * KONFIGURASI REDIRECT BERDASARKAN ROLE
 * ============================================================
 * Tambahkan mapping role_name → path tujuan di sini.
 * Nama role harus sama PERSIS (case-insensitive) dengan yang
 * ada di database (tabel: roles.name).
 *
 * Contoh:
 *   "ADMIN"    → dashboard admin
 *   "TENANT"   → dashboard tenant/UMKM
 *   "STAFF"    → halaman khusus staff
 * ============================================================
 */

export const ROLE_REDIRECTS: Record<string, string> = {
  ADMIN:  "/backend/admin/dashboard",
  TENANT: "/backend/tenant",
  OWNER:  "/backend/tenant",  // Arahkan Owner ke folder tenant
  STAFF:  "/backend/tenant",  // Arahkan Staff ke folder tenant
  UMKM:   "/backend/tenant",  // Arahkan UMKM (Pengelola Cabang) ke folder tenant
};

/**
 * Default redirect jika role tidak ada di mapping di atas.
 * Bisa diubah ke halaman "akses ditolak" atau dashboard umum.
 */
export const DEFAULT_REDIRECT = "/unauthorized";

/**
 * Helper: ambil path redirect berdasarkan nama role.
 * @param roleName - nama role dari database (case-insensitive)
 */
export function getRedirectByRole(roleName: string | null | undefined): string {
  if (!roleName) return DEFAULT_REDIRECT;
  const key = roleName.toUpperCase();
  return ROLE_REDIRECTS[key] ?? DEFAULT_REDIRECT;
}
