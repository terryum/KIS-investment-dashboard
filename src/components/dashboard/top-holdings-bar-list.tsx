"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { AggregatedHolding } from "@/hooks/use-portfolio";
import { CardLoading } from "@/components/common/card-loading";

interface TopHoldingsBarListProps {
  holdings?: AggregatedHolding[];
  isLoading?: boolean;
}

export function TopHoldingsBarList({
  holdings,
  isLoading,
}: TopHoldingsBarListProps) {
  if (isLoading || !holdings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>상위 10 종목</CardTitle>
        </CardHeader>
        <CardContent>
          <CardLoading label="보유 종목 정리 중..." />
        </CardContent>
      </Card>
    );
  }

  const top10 = [...holdings]
    .sort((a, b) => b.evaluation_amount - a.evaluation_amount)
    .slice(0, 10)
    .map((h) => ({
      name: h.name.length > 10 ? h.name.slice(0, 10) + "…" : h.name,
      value: h.evaluation_amount,
      pnl: h.pnl,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>상위 10 종목</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis
              type="number"
              tickFormatter={(v) =>
                Number(v) >= 100_000_000
                  ? `${(Number(v) / 100_000_000).toFixed(0)}억`
                  : `${(Number(v) / 10_000).toFixed(0)}만`
              }
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              fontSize={11}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) =>
                `${Number(value).toLocaleString("ko-KR")}원`
              }
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {top10.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.pnl >= 0 ? "#ef4444" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
