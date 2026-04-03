/**
 * Check if a date is a business day (Mon-Fri).
 * Does not account for Korean public holidays.
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/**
 * Get the last business day before/on the given date.
 * @param from - reference date
 * @param offset - how many business days to go back (0 = same day or closest previous)
 */
export function getLastBusinessDay(from: Date, offset = 0): Date {
  const result = new Date(from);
  let count = 0;

  while (count <= offset) {
    if (!isBusinessDay(result)) {
      result.setDate(result.getDate() - 1);
      continue;
    }
    if (count === offset) break;
    result.setDate(result.getDate() - 1);
    count++;
  }

  return result;
}

/**
 * Format date as Korean style: 2026년 4월 4일 (금)
 */
export function formatKoreanDate(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dayName = days[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${dayName})`;
}

/**
 * Format date as YYYY-MM-DD.
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date as YYYYMMDD (KIS API format).
 */
export function formatDateKIS(date: Date): string {
  return formatDateISO(date).replace(/-/g, '');
}
