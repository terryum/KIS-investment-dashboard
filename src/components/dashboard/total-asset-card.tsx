"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/money-display";
import { PercentDisplay } from "@/components/common/percent-display";
import type { Snapshot } from "@/hooks/use-portfolio";

interface TotalAssetCardProps {
  totalValue: number;
  previousSnapshot?: Snapshot | null;
  isLoading?: boolean;
}

export function TotalAssetCard({
  totalValue,
  previousSnapshot,
  isLoading,
}: TotalAssetCardProps) {
  const change = previousSnapshot
    ? totalValue - previousSnapshot.total_value
    : 0;
  const changePercent =
    previousSnapshot && previousSnapshot.total_value > 0
      ? (change / previousSnapshot.total_value) * 100
      : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>총 자산</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>총 자산</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <MoneyDisplay
          amount={totalValue}
          showColor={false}
          className="text-3xl font-bold"
        />
        {previousSnapshot && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">전주 대비</span>
            <MoneyDisplay amount={change} showSign showColor />
            <PercentDisplay value={changePercent} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
