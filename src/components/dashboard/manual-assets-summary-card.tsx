"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/money-display";
import type { ManualAsset } from "@/hooks/use-portfolio";
import { CardLoading } from "@/components/common/card-loading";

interface ManualAssetsSummaryCardProps {
  assets?: ManualAsset[];
  isLoading?: boolean;
}

export function ManualAssetsSummaryCard({
  assets,
  isLoading,
}: ManualAssetsSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>수동 자산</CardTitle>
        </CardHeader>
        <CardContent>
          <CardLoading />
        </CardContent>
      </Card>
    );
  }

  const items = assets ?? [];
  const totalAssets = items
    .filter((a) => !a.is_liability)
    .reduce((sum, a) => sum + a.current_value, 0);
  const totalLiabilities = items
    .filter((a) => a.is_liability)
    .reduce((sum, a) => sum + a.current_value, 0);
  const net = totalAssets - totalLiabilities;

  // Group by category
  const categories = new Map<string, number>();
  for (const a of items) {
    const current = categories.get(a.category) ?? 0;
    categories.set(
      a.category,
      current + (a.is_liability ? -a.current_value : a.current_value),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>수동 자산</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <MoneyDisplay
          amount={net}
          showColor={false}
          className="text-xl font-bold"
        />
        {items.length > 0 ? (
          <div className="space-y-1">
            {Array.from(categories.entries()).map(([category, value]) => (
              <div
                key={category}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{category}</span>
                <MoneyDisplay amount={value} showSign showColor className="text-sm" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            수동 등록 자산이 없습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}
