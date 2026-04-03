"use client";

import {
  useAssetClassAllocation,
  useCountryAllocation,
  useCurrencyAllocation,
  useStockStructure,
  useBondStructure,
} from "@/hooks/use-allocation";
import { AllocationSection } from "@/components/allocation/allocation-section";
import { AIInsightCard } from "@/components/allocation/ai-insight-card";

const ASSET_CLASS_COLORS: Record<string, string> = {
  주식: "#3b82f6",
  채권: "#22c55e",
  현금: "#6b7280",
  "금/원자재": "#f59e0b",
  대체투자: "#a855f7",
  부동산: "#f97316",
};

const COUNTRY_COLORS: Record<string, string> = {
  한국: "#3b82f6",
  미국: "#ef4444",
  중국: "#f59e0b",
  일본: "#ec4899",
  인도: "#22c55e",
  유럽: "#6366f1",
  아시아: "#14b8a6",
  신흥국: "#a855f7",
  글로벌: "#6b7280",
};

const CURRENCY_COLORS: Record<string, string> = {
  KRW: "#3b82f6",
  USD: "#22c55e",
  CNY: "#f59e0b",
  JPY: "#ec4899",
  EUR: "#6366f1",
};

const STOCK_STRUCTURE_COLORS: Record<string, string> = {
  "Broad ETF": "#3b82f6",
  Factor: "#22c55e",
  Sector: "#f59e0b",
  Theme: "#a855f7",
  개별주: "#ef4444",
};

const BOND_STRUCTURE_COLORS: Record<string, string> = {
  "1Y": "#3b82f6",
  "1-3Y": "#22c55e",
  "3-5Y": "#f59e0b",
  "5-10Y": "#a855f7",
  "10Y+": "#ef4444",
  HTM: "#6b7280",
  MTM: "#14b8a6",
};

export default function AllocationPage() {
  const assetClass = useAssetClassAllocation();
  const country = useCountryAllocation();
  const currency = useCurrencyAllocation();
  const stockStructure = useStockStructure();
  const bondStructure = useBondStructure();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">자산배분</h2>

      <AllocationSection
        title="자산군별 배분"
        data={assetClass.data}
        colors={ASSET_CLASS_COLORS}
        isLoading={assetClass.isLoading}
      />

      <AllocationSection
        title="국가별 배분"
        data={country.data}
        colors={COUNTRY_COLORS}
        isLoading={country.isLoading}
      />

      <AllocationSection
        title="통화별 배분"
        data={currency.data}
        colors={CURRENCY_COLORS}
        isLoading={currency.isLoading}
      />

      <AllocationSection
        title="주식 구조"
        data={stockStructure.data}
        colors={STOCK_STRUCTURE_COLORS}
        isLoading={stockStructure.isLoading}
      />

      <AllocationSection
        title="채권 구조"
        data={bondStructure.data}
        colors={BOND_STRUCTURE_COLORS}
        isLoading={bondStructure.isLoading}
      />

      <AIInsightCard />
    </div>
  );
}
