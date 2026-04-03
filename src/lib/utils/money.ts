/**
 * Format number as Korean won with commas.
 * e.g., 1234567 → "1,234,567원"
 */
export function formatKRW(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

/**
 * Format number with commas (no currency suffix).
 * e.g., 1234567.89 → "1,234,567.89"
 */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format USD amount.
 * e.g., 1234.56 → "$1,234.56"
 */
export function formatUSD(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format percentage.
 * e.g., 12.345 → "+12.35%", -5.6 → "-5.60%"
 */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format currency amount based on currency code.
 */
export function formatCurrency(value: number, currency: string): string {
  switch (currency) {
    case 'KRW':
      return formatKRW(value);
    case 'USD':
      return formatUSD(value);
    default:
      return `${formatNumber(value, 2)} ${currency}`;
  }
}
