"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Snapshot } from "./hooks";

interface ReturnsLineChartProps {
  snapshots: Snapshot[];
}

export function ReturnsLineChart({ snapshots }: ReturnsLineChartProps) {
  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">자산 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            차트를 표시할 데이터가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: s.date,
      총자산: s.total_value,
      투자원금: s.total_invested,
    }));

  const formatKRW = (value: number) => {
    if (value >= 1_0000_0000) return `${(value / 1_0000_0000).toFixed(1)}억`;
    if (value >= 1_0000) return `${(value / 1_0000).toFixed(0)}만`;
    return value.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">자산 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={formatKRW}
                width={60}
              />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toLocaleString()}원`,
                ]}
                labelFormatter={(label) => `날짜: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="총자산"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="투자원금"
                stroke="hsl(var(--chart-2))"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
