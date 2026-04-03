"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { AllocationSlice } from "@/lib/allocation/types";

const DEFAULT_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#6b7280",
  "#f59e0b",
  "#a855f7",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#ef4444",
];

interface DonutChartProps {
  slices: AllocationSlice[];
  colors?: Record<string, string>;
  onSliceClick?: (label: string) => void;
}

export function DonutChart({ slices, colors, onSliceClick }: DonutChartProps) {
  const chartData = slices.map((s) => ({
    name: s.label,
    value: s.value,
    percent: s.percent,
  }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            dataKey="value"
            stroke="none"
            onClick={(_, index) => {
              const label = chartData[index]?.name;
              if (label) onSliceClick?.(label);
            }}
            className="cursor-pointer"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={
                  colors?.[entry.name] ??
                  DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                }
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              `${(Number(value) / 10_000).toFixed(0)}만원`
            }
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-col gap-1.5 text-sm">
        {chartData.map((entry, index) => (
          <button
            type="button"
            key={entry.name}
            onClick={() => onSliceClick?.(entry.name)}
            className="flex items-center gap-2 rounded px-1 py-0.5 text-left transition-colors hover:bg-muted"
          >
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{
                backgroundColor:
                  colors?.[entry.name] ??
                  DEFAULT_COLORS[index % DEFAULT_COLORS.length],
              }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-[family-name:var(--font-geist-mono)] tabular-nums ml-auto">
              {entry.percent.toFixed(1)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
