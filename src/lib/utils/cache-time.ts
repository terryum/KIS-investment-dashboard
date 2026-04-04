const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Returns milliseconds until next 6:00 AM KST.
 * If it's before 6AM KST today, returns time until 6AM today.
 * If it's after 6AM KST today, returns time until 6AM tomorrow.
 * Minimum 1 minute to avoid zero/negative staleTime.
 */
export function getStaleTimeUntil6AM(): number {
  const now = Date.now();
  const kstNow = new Date(now + KST_OFFSET_MS);

  // Build next 6AM KST as a UTC timestamp
  const kstDate = new Date(
    Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate(),
      6, // 6AM KST = 6:00 in KST-adjusted date
      0,
      0,
      0,
    ),
  );
  // Convert back from KST to UTC
  let next6amUtc = kstDate.getTime() - KST_OFFSET_MS;

  if (next6amUtc <= now) {
    next6amUtc += 24 * 60 * 60 * 1000;
  }

  return Math.max(next6amUtc - now, 60 * 1000);
}
