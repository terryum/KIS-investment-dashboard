"use client";

import { cacheGet, cacheSet, cacheGetIgnoreExpiry } from "@/lib/cache/indexeddb";
import { getStaleTimeUntil6AM } from "@/lib/utils/cache-time";

/**
 * Fetch JSON from API with IndexedDB persistent cache.
 *
 * Flow:
 * 1. Check IndexedDB for cached data (key = URL, TTL = until 6AM KST)
 * 2. If cached and not expired → return cached data immediately (no API call)
 * 3. If not cached or expired → fetch from API → save to IndexedDB → return
 * 4. If API fails → try stale cache (ignore expiry) as last resort
 */
export async function fetchJsonWithCache<T>(url: string): Promise<T> {
  const cacheKey = `api:${url}`;

  // 1. Try IndexedDB cache first
  const cached = await cacheGet<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // 2. Cache miss — fetch from API
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    const json = await res.json();
    const data = json.data as T;

    // 3. Save to IndexedDB with TTL until next 6AM KST
    const ttl = getStaleTimeUntil6AM();
    await cacheSet(cacheKey, data, ttl);

    return data;
  } catch (err) {
    // 4. API failed → try stale cache (ignore expiry)
    const stale = await cacheGetIgnoreExpiry<T>(cacheKey);
    if (stale !== null) return stale;
    throw err;
  }
}
