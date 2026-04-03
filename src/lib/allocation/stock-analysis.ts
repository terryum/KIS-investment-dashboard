import type { AllocationItem, AllocationResult, AllocationSlice } from './types';

const STRUCTURE_LABELS: Record<string, string> = {
  broad: '시장 전체 (Broad)',
  factor: '팩터 (Factor)',
  sector: '섹터 (Sector)',
  theme: '테마 (Theme)',
  individual: '개별종목',
};

/** Group stock holdings by etf_structure */
export function calculateStockStructure(items: AllocationItem[]): AllocationResult {
  const stockItems = items.filter((i) => i.tags.real_asset_class === 'stock');
  const total = stockItems.reduce((sum, i) => sum + i.evaluation_amount, 0);
  if (total === 0) return { total: 0, slices: [] };

  const groups = new Map<string, AllocationItem[]>();
  for (const item of stockItems) {
    const key = item.tags.etf_structure;
    const arr = groups.get(key);
    if (arr) arr.push(item);
    else groups.set(key, [item]);
  }

  const slices: AllocationSlice[] = Array.from(groups.entries())
    .map(([key, groupItems]) => {
      const value = groupItems.reduce((sum, i) => sum + i.evaluation_amount, 0);
      return {
        label: STRUCTURE_LABELS[key] ?? key,
        value,
        percent: (value / total) * 100,
        items: groupItems,
      };
    })
    .sort((a, b) => b.value - a.value);

  return { total, slices };
}
