"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/money-display";
import type { IncomeSummary } from "./hooks";

interface IncomeSummaryCardProps {
  summaries: IncomeSummary[];
  year: number;
}

export function IncomeSummaryCard({ summaries, year }: IncomeSummaryCardProps) {
  const yearSummaries = summaries.filter((s) => s.year === year);
  const totalAmount = yearSummaries.reduce((sum, s) => sum + s.total_amount, 0);
  const totalCount = yearSummaries.reduce((sum, s) => sum + s.count, 0);

  const currentMonth = new Date().getMonth() + 1;
  const monthsElapsed = year === new Date().getFullYear() ? currentMonth : 12;
  const monthlyAvg = monthsElapsed > 0 ? totalAmount / monthsElapsed : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{year}년 인컴 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">YTD 합계</span>
          <MoneyDisplay
            amount={totalAmount}
            showColor={false}
            className="text-lg font-semibold"
          />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">월평균</span>
          <MoneyDisplay
            amount={monthlyAvg}
            showColor={false}
            className="text-base"
          />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">건수</span>
          <span className="text-sm tabular-nums">{totalCount}건</span>
        </div>
      </CardContent>
    </Card>
  );
}
