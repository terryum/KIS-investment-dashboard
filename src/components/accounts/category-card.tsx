"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/money-display";
import { HoldingItemCard } from "./holding-item-card";

interface HoldingData {
  ticker: string;
  name: string;
  market?: "KRX" | "NASD" | "NYSE" | "AMEX" | "BOND";
  quantity: number;
  evaluationAmount: number;
  purchaseAmount: number;
  pnl: number;
  pnlPercent: number;
  currency: string;
}

interface CategoryCardProps {
  title: string;
  holdings: HoldingData[];
  onHoldingClick?: (ticker: string) => void;
}

export function CategoryCard({
  title,
  holdings,
  onHoldingClick,
}: CategoryCardProps) {
  if (holdings.length === 0) return null;

  const total = holdings.reduce((sum, h) => sum + h.evaluationAmount, 0);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <MoneyDisplay
            amount={total}
            showColor={false}
            className="text-sm font-medium"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {holdings.map((h) => (
          <HoldingItemCard
            key={h.ticker}
            {...h}
            onClick={() => onHoldingClick?.(h.ticker)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
