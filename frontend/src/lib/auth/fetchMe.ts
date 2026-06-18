let cachedData: Record<string, unknown> | null = null;
let fetchPromise: Promise<Record<string, unknown> | null> | null = null;

export function fetchMeOnce(): Promise<Record<string, unknown> | null> {
  if (cachedData) return Promise.resolve(cachedData);
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/auth/me")
    .then((res) => (res.ok ? res.json() : null))
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
