"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyCashFlow } from "./hooks";

interface MonthlyCashFlowChartProps {
  data: MonthlyCashFlow[];
}

export function MonthlyCashFlowChart({ data }: MonthlyCashFlowChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">월별 현금흐름</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [...data]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((d) => ({
      month: d.month,
      입금: d.total_inflow,
      출금: Math.abs(d.total_outflow),
    }));

  const formatKRW = (value: number) => {
    if (value >= 1_0000_0000) return `${(value / 1_0000_0000).toFixed(1)}억`;
    if (value >= 1_0000) return `${(value / 1_0000).toFixed(0)}만`;
    return value.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">월별 현금흐름</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatKRW} width={60} />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}원`]} />
              <Legend />
              <Bar dataKey="입금" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="출금" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
