import type { AllocationItem, AllocationResult, AllocationSlice } from './types';

const COUNTRY_LABELS: Record<string, string> = {
  KR: '한국',
  US: '미국',
  CN: '중국',
  JP: '일본',
  IN: '인도',
  EU: '유럽',
  ASIA: '아시아',
  EM: '이머징',
  GLOBAL: '글로벌',
};

/** Group holdings by country tag and compute allocation percentages */
export function calculateCountryAllocation(items: AllocationItem[]): AllocationResult {
  const total = items.reduce((sum, i) => sum + i.evaluation_amount, 0);
  if (total === 0) return { total: 0, slices: [] };

  const groups = new Map<string, AllocationItem[]>();
  for (const item of items) {
    const key = item.tags.country;
    const arr = groups.get(key);
    if (arr) arr.push(item);
    else groups.set(key, [item]);
  }

  const slices: AllocationSlice[] = Array.from(groups.entries())
    .map(([key, groupItems]) => {
      const value = groupItems.reduce((sum, i) => sum + i.evaluation_amount, 0);
      return {
        label: COUNTRY_LABELS[key] ?? key,
        value,
        percent: (value / total) * 100,
        items: groupItems,
      };
    })
    .sort((a, b) => b.value - a.value);

  return { total, slices };
}
