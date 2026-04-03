/** TTL policies in milliseconds per data type */
export const CACHE_TTL = {
  portfolio: 30 * 60 * 1000, // 30분
  bonds: 7 * 24 * 60 * 60 * 1000, // 7일
  exchangeRate: 12 * 60 * 60 * 1000, // 12시간
  snapshot: 60 * 60 * 1000, // 1시간
  aiInsight: 60 * 60 * 1000, // 1시간
  news: 15 * 60 * 1000, // 15분
} as const;

export type CacheDataType = keyof typeof CACHE_TTL;
