import type { AllocationItem, AllocationResult, AllocationSlice } from './types';

const ASSET_CLASS_LABELS: Record<string, string> = {
  stock: '주식',
  bond: '채권',
  commodity: '원자재',
  alternative: '대체투자',
  reit: '리츠',
};

/** Group holdings by real_asset_class and compute allocation percentages */
export function calculateAssetClassAllocation(items: AllocationItem[]): AllocationResult {
  const total = items.reduce((sum, i) => sum + i.evaluation_amount, 0);
  if (total === 0) return { total: 0, slices: [] };

  const groups = new Map<string, AllocationItem[]>();
  for (const item of items) {
    const key = item.tags.real_asset_class;
    const arr = groups.get(key);
    if (arr) arr.push(item);
    else groups.set(key, [item]);
  }

  const slices: AllocationSlice[] = Array.from(groups.entries())
    .map(([key, groupItems]) => {
      const value = groupItems.reduce((sum, i) => sum + i.evaluation_amount, 0);
      return {
        label: ASSET_CLASS_LABELS[key] ?? key,
        value,
        percent: (value / total) * 100,
        items: groupItems,
      };
    })
    .sort((a, b) => b.value - a.value);

  return { total, slices };
}
