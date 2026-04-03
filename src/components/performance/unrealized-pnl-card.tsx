"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/money-display";
import { PercentDisplay } from "@/components/common/percent-display";
import type { Snapshot } from "./hooks";

interface UnrealizedPnLCardProps {
  snapshot: Snapshot | null;
}

export function UnrealizedPnLCard({ snapshot }: UnrealizedPnLCardProps) {
  if (!snapshot) return null;

  const invested = snapshot.total_invested;
  const pnlPercent =
    invested > 0 ? (snapshot.unrealized_pnl / invested) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">미실현 손익 현황</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">미실현 손익</span>
          <MoneyDisplay
            amount={snapshot.unrealized_pnl}
            showSign
            showColor
            className="text-lg font-semibold"
          />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">수익률</span>
          <PercentDisplay value={pnlPercent} className="text-base" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">투자원금</span>
          <MoneyDisplay
            amount={invested}
            showColor={false}
            className="text-sm"
          />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">평가금액</span>
          <MoneyDisplay
            amount={snapshot.total_value}
            showColor={false}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
