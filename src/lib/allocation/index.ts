// Types
export type {
  AssetTags,
  AllocationItem,
  AllocationSlice,
  AllocationResult,
  MaturityBracket,
  BondHolding,
} from './types';

// ETF classifier
export { classifyETF } from './classifier';

// Allocation calculators
export { calculateAssetClassAllocation } from './asset-class';
export { calculateCountryAllocation } from './country';
export { calculateCurrencyAllocation } from './currency';
export { calculateStockStructure } from './stock-analysis';
export { calculateBondMaturityStructure, calculateBondStrategyStructure } from './bond-analysis';
