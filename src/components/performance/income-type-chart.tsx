"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IncomeSummary } from "./hooks";

interface IncomeTypeChartProps {
  summaries: IncomeSummary[];
  year: number;
}

const TYPE_LABELS: Record<string, string> = {
  dividend: "배당",
  distribution: "분배",
  interest: "이자",
};

const TYPE_COLORS: Record<string, string> = {
  dividend: "hsl(var(--chart-1))",
  distribution: "hsl(var(--chart-2))",
  interest: "hsl(var(--chart-3))",
};

export function IncomeTypeChart({ summaries, year }: IncomeTypeChartProps) {
  const yearSummaries = summaries.filter((s) => s.year === year);

  if (yearSummaries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">인컴 유형별</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const data = yearSummaries.map((s) => ({
    name: TYPE_LABELS[s.type] ?? s.type,
    value: s.total_amount,
    type: s.type,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">인컴 유형별</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.type}
                    fill={TYPE_COLORS[entry.type] ?? "hsl(var(--chart-4))"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString()}원`]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
