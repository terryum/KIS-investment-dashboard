"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/common/money-display";
import type { IncomeSummary } from "@/hooks/use-portfolio";

interface RecentIncomeCardProps {
  data?: IncomeSummary[];
  isLoading?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  dividend: "배당금",
  interest: "이자",
  distribution: "분배금",
};

export function RecentIncomeCard({ data, isLoading }: RecentIncomeCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>올해 인컴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-16 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const currentYear = new Date().getFullYear();
  const ytdItems = (data ?? []).filter((d) => d.year === currentYear);
  const ytdTotal = ytdItems.reduce((sum, d) => sum + d.total_amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>올해 인컴</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <MoneyDisplay
          amount={ytdTotal}
          showColor={false}
          className="text-xl font-bold"
        />
        {ytdItems.length > 0 ? (
          <div className="space-y-1">
            {ytdItems.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {TYPE_LABELS[item.type] ?? item.type}
                </span>
                <div className="flex items-center gap-2">
                  <MoneyDisplay
                    amount={item.total_amount}
                    showColor={false}
                    className="text-sm"
                  />
                  <span className="text-xs text-muted-foreground">
                    ({item.count}건)
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            올해 인컴 내역이 없습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}
