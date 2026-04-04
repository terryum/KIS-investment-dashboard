import { getStaleTimeUntil6AM } from "@/lib/utils/cache-time";

/** TTL policies — all expire at next 6:00 AM KST */
export function getCacheTTL() {
  const until6am = getStaleTimeUntil6AM();
  return {
    portfolio: until6am,
    bonds: until6am,
    exchangeRate: until6am,
    snapshot: until6am,
    aiInsight: until6am,
    news: until6am,
  };
}

/** @deprecated Use getCacheTTL() for dynamic values */
export const CACHE_TTL = {
  portfolio: 30 * 60 * 1000,
  bonds: 7 * 24 * 60 * 60 * 1000,
  exchangeRate: 12 * 60 * 60 * 1000,
  snapshot: 60 * 60 * 1000,
  aiInsight: 60 * 60 * 1000,
  news: 15 * 60 * 1000,
} as const;

export type CacheDataType = keyof typeof CACHE_TTL;
