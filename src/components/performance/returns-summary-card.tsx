"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/money-display";
import { PercentDisplay } from "@/components/common/percent-display";
import type { Snapshot } from "./hooks";

interface ReturnsSummaryCardProps {
  latest: Snapshot | null;
  earliest: Snapshot | null;
}

export function ReturnsSummaryCard({
  latest,
  earliest,
}: ReturnsSummaryCardProps) {
  if (!latest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">수익률 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            스냅샷 데이터가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalReturn =
    earliest && earliest.total_invested > 0
      ? ((latest.total_value - earliest.total_value) / earliest.total_value) *
        100
      : 0;

  const totalPnl = earliest
    ? latest.total_value - earliest.total_value
    : latest.unrealized_pnl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">수익률 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">총 자산</span>
          <MoneyDisplay amount={latest.total_value} className="text-lg font-semibold" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">기간 손익</span>
          <MoneyDisplay amount={totalPnl} showSign showColor className="text-base font-medium" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">기간 수익률</span>
          <PercentDisplay value={totalReturn} className="text-base font-medium" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">미실현 손익</span>
          <MoneyDisplay amount={latest.unrealized_pnl} showSign showColor className="text-sm" />
        </div>
      </CardContent>
    </Card>
  );
}
