import type { AllocationItem, AllocationResult, AllocationSlice } from './types';

const CURRENCY_LABELS: Record<string, string> = {
  KRW: '원화 (KRW)',
  USD: '달러 (USD)',
  CNY: '위안 (CNY)',
  JPY: '엔화 (JPY)',
  EUR: '유로 (EUR)',
};

/** Group holdings by real_currency (hedged ETFs count as KRW) */
export function calculateCurrencyAllocation(items: AllocationItem[]): AllocationResult {
  const total = items.reduce((sum, i) => sum + i.evaluation_amount, 0);
  if (total === 0) return { total: 0, slices: [] };

  const groups = new Map<string, AllocationItem[]>();
  for (const item of items) {
    const key = item.tags.is_hedged ? 'KRW' : item.tags.real_currency;
    const arr = groups.get(key);
    if (arr) arr.push(item);
    else groups.set(key, [item]);
  }

  const slices: AllocationSlice[] = Array.from(groups.entries())
    .map(([key, groupItems]) => {
      const value = groupItems.reduce((sum, i) => sum + i.evaluation_amount, 0);
      return {
        label: CURRENCY_LABELS[key] ?? key,
        value,
        percent: (value / total) * 100,
        items: groupItems,
      };
    })
    .sort((a, b) => b.value - a.value);

  return { total, slices };
}
