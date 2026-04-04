"use client";

import {
  useHoldings,
  useManualAssets,
  useLatestSnapshot,
  useSnapshots,
  useIncomeSummary,
} from "@/hooks/use-portfolio";
import { useAssetClassAllocation } from "@/hooks/use-allocation";
import { TotalAssetCard } from "@/components/dashboard/total-asset-card";
import { DailyChangeCard } from "@/components/dashboard/daily-change-card";
import { AssetAllocationMiniChart } from "@/components/dashboard/asset-allocation-mini-chart";
import { TopHoldingsBarList } from "@/components/dashboard/top-holdings-bar-list";
import { PortfolioValueMiniChart } from "@/components/dashboard/portfolio-value-mini-chart";
import { RecentIncomeCard } from "@/components/dashboard/recent-income-card";
import { ManualAssetsSummaryCard } from "@/components/dashboard/manual-assets-summary-card";

export default function DashboardPage() {
  const holdings = useHoldings();
  const manualAssets = useManualAssets();
  const latestSnapshot = useLatestSnapshot();
  const snapshots = useSnapshots();
  const incomeSummary = useIncomeSummary();
  const assetClassAllocation = useAssetClassAllocation();

  // Compute totals from holdings (0 while loading)
  const holdingsList = holdings.data?.holdings ?? [];
  const totalEvaluation = holdingsList.reduce(
    (sum, h) => sum + h.evaluation_amount,
    0,
  );
  const totalPurchase = holdingsList.reduce(
    (sum, h) => sum + h.purchase_amount,
    0,
  );
  const totalPnl = holdingsList.reduce((sum, h) => sum + h.pnl, 0);
  const totalPnlPercent =
    totalPurchase > 0 ? (totalPnl / totalPurchase) * 100 : 0;

  const manualTotal = (manualAssets.data ?? []).reduce(
    (sum, a) => sum + (a.is_liability ? -a.current_value : a.current_value),
    0,
  );
  const grandTotal = totalEvaluation + manualTotal;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">대시보드</h2>

      {/* Top summary row — each card handles its own loading state */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TotalAssetCard
          totalValue={grandTotal}
          previousSnapshot={latestSnapshot.data}
          isLoading={holdings.isLoading || manualAssets.isLoading}
        />
        <DailyChangeCard
          totalPnl={totalPnl}
          totalPnlPercent={totalPnlPercent}
          totalPurchase={totalPurchase}
          isLoading={holdings.isLoading}
        />
        <AssetAllocationMiniChart
          data={assetClassAllocation.data}
          isLoading={assetClassAllocation.isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopHoldingsBarList
          holdings={holdings.data?.holdings}
          isLoading={holdings.isLoading}
        />
        <PortfolioValueMiniChart
          snapshots={snapshots.data}
          isLoading={snapshots.isLoading}
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RecentIncomeCard
          data={incomeSummary.data}
          isLoading={incomeSummary.isLoading}
        />
        <ManualAssetsSummaryCard
          assets={manualAssets.data}
          isLoading={manualAssets.isLoading}
        />
      </div>
    </div>
  );
}
