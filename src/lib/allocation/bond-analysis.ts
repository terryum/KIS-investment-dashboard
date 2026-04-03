import type { AllocationResult, AllocationSlice, BondHolding, MaturityBracket } from './types';
import { getMaturityBracket } from '../utils/bond';

const BRACKET_LABELS: Record<MaturityBracket, string> = {
  '1Y': '1년 이내',
  '1-3Y': '1~3년',
  '3-5Y': '3~5년',
  '5-10Y': '5~10년',
  '10Y+': '10년 이상',
};

const STRATEGY_LABELS: Record<string, string> = {
  HTM: '만기보유 (HTM)',
  MTM: '시가평가 (MTM)',
};

/** Group bond holdings by maturity bracket */
export function calculateBondMaturityStructure(items: BondHolding[]): AllocationResult {
  const bondItems = items.filter((i) => i.tags.real_asset_class === 'bond');
  const total = bondItems.reduce((sum, i) => sum + i.evaluation_amount, 0);
  if (total === 0) return { total: 0, slices: [] };

  const groups = new Map<MaturityBracket, BondHolding[]>();
  for (const item of bondItems) {
    const bracket = item.maturity_date ? getMaturityBracket(item.maturity_date) : '1Y';
    const arr = groups.get(bracket);
    if (arr) arr.push(item);
    else groups.set(bracket, [item]);
  }

  const order: MaturityBracket[] = ['1Y', '1-3Y', '3-5Y', '5-10Y', '10Y+'];
  const slices: AllocationSlice[] = order
    .filter((b) => groups.has(b))
    .map((bracket) => {
      const groupItems = groups.get(bracket)!;
      const value = groupItems.reduce((sum, i) => sum + i.evaluation_amount, 0);
      return {
        label: BRACKET_LABELS[bracket],
        value,
        percent: (value / total) * 100,
        items: groupItems,
      };
    });

  return { total, slices };
}

/** Group bond holdings by HTM / MTM strategy */
export function calculateBondStrategyStructure(items: BondHolding[]): AllocationResult {
  const bondItems = items.filter((i) => i.tags.real_asset_class === 'bond');
  const total = bondItems.reduce((sum, i) => sum + i.evaluation_amount, 0);
  if (total === 0) return { total: 0, slices: [] };

  const groups = new Map<string, BondHolding[]>();
  for (const item of bondItems) {
    const key = item.bond_strategy ?? 'MTM';
    const arr = groups.get(key);
    if (arr) arr.push(item);
    else groups.set(key, [item]);
  }

  const slices: AllocationSlice[] = Array.from(groups.entries())
    .map(([key, groupItems]) => {
      const value = groupItems.reduce((sum, i) => sum + i.evaluation_amount, 0);
      return {
        label: STRATEGY_LABELS[key] ?? key,
        value,
        percent: (value / total) * 100,
        items: groupItems,
      };
    })
    .sort((a, b) => b.value - a.value);

  return { total, slices };
}
