"use client";

import { useState } from "react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PeriodSelector, getDateRange, type Period } from "@/components/performance/period-selector";
import { ReturnsSummaryCard } from "@/components/performance/returns-summary-card";
import { ReturnsLineChart } from "@/components/performance/returns-line-chart";
import { UnrealizedPnLCard } from "@/components/performance/unrealized-pnl-card";
import { HoldingsReturnTable, type HoldingReturn } from "@/components/performance/holdings-return-table";
import { MonthlyCashFlowChart } from "@/components/performance/monthly-cash-flow-chart";
import { AssetGrowthBreakdownChart } from "@/components/performance/asset-growth-breakdown-chart";
import { CashFlowTable } from "@/components/performance/cash-flow-table";
import { AddCashFlowDialog } from "@/components/performance/add-cash-flow-dialog";
import { YearSelector } from "@/components/performance/year-selector";
import { IncomeSummaryCard } from "@/components/performance/income-summary-card";
import { IncomeTypeChart } from "@/components/performance/income-type-chart";
import { IncomeTable } from "@/components/performance/income-table";
import { DividendScheduleCard } from "@/components/performance/dividend-schedule-card";
import {
  useSnapshots,
  useLatestSnapshot,
  useCashFlows,
  useMonthlyCashFlows,
  useIncome,
  useIncomeSummary,
} from "@/components/performance/hooks";

export default function PerformancePage() {
  const [period, setPeriod] = useState<Period>("3M");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [incomeYear, setIncomeYear] = useState(() => new Date().getFullYear());

  const handlePeriodSelect = (p: Period) => {
    setPeriod(p);
  };

  const handleCustomRangeApply = (range: DateRange) => {
    setCustomRange(range);
    setPeriod("CUSTOM");
  };

  const { from, to } =
    period === "CUSTOM" && customRange?.from && customRange?.to
      ? {
          from: format(customRange.from, "yyyy-MM-dd"),
          to: format(customRange.to, "yyyy-MM-dd"),
        }
      : getDateRange(period);

  const { data: snapshots = [] } = useSnapshots(from, to);
  const { data: latestSnapshot } = useLatestSnapshot();
  const { data: cashFlows = [] } = useCashFlows();
  const { data: monthlyCashFlows = [] } = useMonthlyCashFlows();
  const { data: incomes = [] } = useIncome(incomeYear);
  const { data: incomeSummary = [] } = useIncomeSummary(incomeYear);

  const earliest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const latest = snapshots.length > 0 ? snapshots[0] : latestSnapshot ?? null;

  const holdingsData: HoldingReturn[] = [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">수익률 분석</h2>

      <Tabs defaultValue="returns">
        <TabsList>
          <TabsTrigger value="returns">수익률</TabsTrigger>
          <TabsTrigger value="cashflow">현금흐름</TabsTrigger>
          <TabsTrigger value="income">인컴</TabsTrigger>
        </TabsList>

        <TabsContent value="returns">
          <div className="space-y-4 pt-4">
            <PeriodSelector
              selected={period}
              onSelect={handlePeriodSelect}
              customRange={customRange}
              onCustomRangeApply={handleCustomRangeApply}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <ReturnsSummaryCard latest={latest} earliest={earliest} />
              <UnrealizedPnLCard snapshot={latestSnapshot ?? null} />
            </div>
            <ReturnsLineChart snapshots={snapshots} />
            <div className="max-h-96 overflow-y-auto">
              <HoldingsReturnTable holdings={holdingsData} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cashflow">
          <div className="space-y-4 pt-4">
            <div className="flex justify-end">
              <AddCashFlowDialog />
            </div>
            <MonthlyCashFlowChart data={monthlyCashFlows} />
            <AssetGrowthBreakdownChart snapshots={snapshots} />
            <div className="max-h-96 overflow-y-auto">
              <CashFlowTable cashFlows={cashFlows} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="income">
          <div className="space-y-4 pt-4">
            <YearSelector year={incomeYear} onYearChange={setIncomeYear} />
            <div className="grid gap-4 md:grid-cols-2">
              <IncomeSummaryCard summaries={incomeSummary} year={incomeYear} />
              <IncomeTypeChart summaries={incomeSummary} year={incomeYear} />
            </div>
            <div className="max-h-96 overflow-y-auto">
              <IncomeTable incomes={incomes} />
            </div>
            <DividendScheduleCard incomes={incomes} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
