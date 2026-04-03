export { cacheGet, cacheSet, cacheClear, cacheGetTimestamp } from "./indexeddb";
export { CACHE_TTL, type CacheDataType } from "./policies";

/**
 * Generate a cache key from an API path and optional params.
 */
export function getCacheKey(
  path: string,
  params?: Record<string, string>,
): string {
  const sorted = params
    ? Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&")
    : "";
  return sorted ? `${path}?${sorted}` : path;
}
