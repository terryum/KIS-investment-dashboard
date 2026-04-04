"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Snapshot } from "@/hooks/use-portfolio";
import { CardLoading } from "@/components/common/card-loading";

interface PortfolioValueMiniChartProps {
  snapshots?: Snapshot[];
  isLoading?: boolean;
}

export function PortfolioValueMiniChart({
  snapshots,
  isLoading,
}: PortfolioValueMiniChartProps) {
  if (isLoading || !snapshots || snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>자산 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
            {isLoading ? (
              <CardLoading />
            ) : (
              "스냅샷 데이터가 없습니다"
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: s.date.slice(5), // MM-DD
      value: s.total_value,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>자산 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" fontSize={11} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `${(Number(v) / 100_000_000).toFixed(1)}억`}
              fontSize={11}
              width={50}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [
                `${Number(value).toLocaleString("ko-KR")}원`,
                "총 자산",
              ]}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
