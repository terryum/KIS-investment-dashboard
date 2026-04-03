"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Snapshot } from "./hooks";

interface AssetGrowthBreakdownChartProps {
  snapshots: Snapshot[];
}

export function AssetGrowthBreakdownChart({
  snapshots,
}: AssetGrowthBreakdownChartProps) {
  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">자산 증가 분해</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const base = sorted[0];

  const data = sorted.map((s) => ({
    date: s.date,
    투자수익: s.unrealized_pnl - (base?.unrealized_pnl ?? 0),
    신규유입: (s.net_cash_inflow ?? 0) - (base?.net_cash_inflow ?? 0),
    인컴: (s.realized_pnl_ytd ?? 0) - (base?.realized_pnl_ytd ?? 0),
  }));

  const formatKRW = (value: number) => {
    if (Math.abs(value) >= 1_0000_0000)
      return `${(value / 1_0000_0000).toFixed(1)}억`;
    if (Math.abs(value) >= 1_0000)
      return `${(value / 1_0000).toFixed(0)}만`;
    return value.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">자산 증가 분해</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatKRW} width={60} />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}원`]} />
              <Legend />
              <Area
                type="monotone"
                dataKey="투자수익"
                stackId="1"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="신규유입"
                stackId="1"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="인컴"
                stackId="1"
                stroke="hsl(var(--chart-3))"
                fill="hsl(var(--chart-3))"
                fillOpacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
