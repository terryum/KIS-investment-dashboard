"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { AllocationResult } from "@/lib/allocation/types";

const ASSET_CLASS_COLORS: Record<string, string> = {
  주식: "#3b82f6",
  채권: "#22c55e",
  현금: "#6b7280",
  "금/원자재": "#f59e0b",
  대체투자: "#a855f7",
  부동산: "#f97316",
};

const DEFAULT_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#6b7280",
  "#f59e0b",
  "#a855f7",
  "#f97316",
];

interface AssetAllocationMiniChartProps {
  data?: AllocationResult;
  isLoading?: boolean;
}

export function AssetAllocationMiniChart({
  data,
  isLoading,
}: AssetAllocationMiniChartProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>자산 배분</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[180px]">
            <div className="h-32 w-32 animate-pulse rounded-full bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slices.map((s) => ({
    name: s.label,
    value: s.value,
    percent: s.percent,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>자산 배분</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={
                      ASSET_CLASS_COLORS[entry.name] ??
                      DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  `${(Number(value) / 10000).toFixed(0)}만원`
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 text-sm">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      ASSET_CLASS_COLORS[entry.name] ??
                      DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                  }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="font-[family-name:var(--font-geist-mono)] tabular-nums ml-auto">
                  {entry.percent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
