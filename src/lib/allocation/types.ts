/** ETF/asset classification tags stored in assets_master.tags */
export interface AssetTags {
  real_asset_class: 'stock' | 'bond' | 'commodity' | 'alternative' | 'reit';
  country: 'KR' | 'US' | 'CN' | 'JP' | 'IN' | 'EU' | 'ASIA' | 'EM' | 'GLOBAL';
  real_currency: 'KRW' | 'USD' | 'CNY' | 'JPY' | 'EUR';
  etf_structure: 'broad' | 'factor' | 'sector' | 'theme' | 'individual';
  sector?: string;
  is_hedged: boolean;
  ai_classified?: boolean;
  ai_classified_at?: string;
  manual_override?: boolean;
}

/** A single holding item used as input for allocation calculations */
export interface AllocationItem {
  ticker: string;
  name: string;
  evaluation_amount: number; // KRW-denominated value
  currency: string;
  tags: AssetTags;
}

/** One slice of an allocation breakdown */
export interface AllocationSlice {
  label: string;
  value: number;       // KRW amount
  percent: number;     // 0-100
  items: AllocationItem[];
}

/** Result of any allocation calculation */
export interface AllocationResult {
  total: number;
  slices: AllocationSlice[];
}

/** Bond maturity bracket */
export type MaturityBracket = '1Y' | '1-3Y' | '3-5Y' | '5-10Y' | '10Y+';

/** Bond holding with extra bond-specific fields */
export interface BondHolding extends AllocationItem {
  maturity_date?: string;   // YYYY-MM-DD
  coupon_rate?: number;
  purchase_price?: number;
  face_value?: number;
  bond_strategy?: 'HTM' | 'MTM';
}
