import { getMeAction } from "@/app/actions/auth";
import { getRoleFromCookie } from "./roleGuard";

let cachedData: Record<string, unknown> | null = null;
let fetchPromise: Promise<Record<string, unknown> | null> | null = null;

export function resetCachedMe() {
  cachedData = null;
  fetchPromise = null;
}

export function fetchMeOnce(forceRefresh = false): Promise<Record<string, unknown> | null> {
  if (forceRefresh) {
    resetCachedMe();
  }

  // Jika ada ketidakcocokan antara cache dengan cookie role_name yang sedang aktif di browser,
  // segera buang cache agar data user yang baru login dimuat ulang dari backend.
  const currentRole = getRoleFromCookie();
  if (cachedData && currentRole && cachedData.role_name) {
    if (String(cachedData.role_name).toUpperCase() !== currentRole.toUpperCase()) {
      resetCachedMe();
    }
  }

  if (cachedData) return Promise.resolve(cachedData);
  if (fetchPromise) return fetchPromise;

  fetchPromise = getMeAction()
    .then((data) => {
      cachedData = data as Record<string, unknown> | null;
      fetchPromise = null;
      return cachedData;
    })
    .catch(() => {
      fetchPromise = null;
      return null;
    });

  return fetchPromise;
}
