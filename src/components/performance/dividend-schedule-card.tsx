"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import type { Income } from "./hooks";

interface DividendScheduleCardProps {
  incomes: Income[];
}

export function DividendScheduleCard({ incomes }: DividendScheduleCardProps) {
  const today = new Date().toISOString().split("T")[0];
  const upcoming = incomes
    .filter((i) => i.date >= today && i.type === "dividend")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="size-4" />
          배당 예정
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            예정된 배당이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {d.date}
                  </Badge>
                  <span>{d.name ?? d.ticker ?? "-"}</span>
                </div>
                <span className="tabular-nums font-medium">
                  {d.amount.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
