"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/money-display";
import { PercentDisplay } from "@/components/common/percent-display";

interface DailyChangeCardProps {
  totalPnl: number;
  totalPnlPercent: number;
  totalPurchase: number;
  isLoading?: boolean;
}

export function DailyChangeCard({
  totalPnl,
  totalPnlPercent,
  totalPurchase,
  isLoading,
}: DailyChangeCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>평가 손익</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 w-36 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>평가 손익</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <MoneyDisplay
          amount={totalPnl}
          showSign
          showColor
          className="text-2xl font-bold"
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">수익률</span>
          <PercentDisplay value={totalPnlPercent} />
        </div>
        <div className="text-xs text-muted-foreground">
          투자원금{" "}
          <MoneyDisplay
            amount={totalPurchase}
            showColor={false}
            className="text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
