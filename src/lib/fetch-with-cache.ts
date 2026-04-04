"use client";

import { cacheGet, cacheSet } from "@/lib/cache/indexeddb";
import { getStaleTimeUntil6AM } from "@/lib/utils/cache-time";

/**
 * Fetch JSON from API with IndexedDB persistent cache.
 *
 * Flow:
 * 1. Check IndexedDB for cached data (key = URL, TTL = until 6AM KST)
 * 2. If cached and not expired → return cached data immediately (no API call)
 * 3. If not cached or expired → fetch from API → save to IndexedDB → return
 *
 * This ensures data is fetched only once per day (until 6AM reset),
 * even across tab closes and browser restarts.
 */
export async function fetchJsonWithCache<T>(url: string): Promise<T> {
  const cacheKey = `api:${url}`;

  // 1. Try IndexedDB cache first
  const cached = await cacheGet<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // 2. Cache miss — fetch from API
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const json = await res.json();
  const data = json.data as T;

  // 3. Save to IndexedDB with TTL until next 6AM KST
  const ttl = getStaleTimeUntil6AM();
  await cacheSet(cacheKey, data, ttl);

  return data;
}
