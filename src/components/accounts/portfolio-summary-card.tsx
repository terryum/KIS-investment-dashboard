"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/money-display";
import { PercentDisplay } from "@/components/common/percent-display";

interface PortfolioSummaryCardProps {
  totalEvaluation: number;
  totalPurchase: number;
  totalPnl: number;
  totalPnlPercent: number;
  cashBalance: number;
  isLoading?: boolean;
}

export function PortfolioSummaryCard({
  totalEvaluation,
  totalPurchase,
  totalPnl,
  totalPnlPercent,
  cashBalance,
  isLoading,
}: PortfolioSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>포트폴리오 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>포트폴리오 요약</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">총 평가금</p>
            <MoneyDisplay
              amount={totalEvaluation}
              showColor={false}
              className="text-lg font-bold"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">총 투자원금</p>
            <MoneyDisplay
              amount={totalPurchase}
              showColor={false}
              className="text-lg font-bold"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">평가 손익</p>
            <div className="flex items-center gap-1">
              <MoneyDisplay
                amount={totalPnl}
                showSign
                showColor
                className="text-lg font-bold"
              />
            </div>
            <PercentDisplay value={totalPnlPercent} className="text-sm" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">현금</p>
            <MoneyDisplay
              amount={cashBalance}
              showColor={false}
              className="text-lg font-bold"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
