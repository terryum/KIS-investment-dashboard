"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type DateRange } from "react-day-picker";
import { DateRangePicker } from "./date-range-picker";

const PERIODS = [
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "YTD", value: "YTD" },
  { label: "1Y", value: "1Y" },
  { label: "ALL", value: "ALL" },
] as const;

export type Period = (typeof PERIODS)[number]["value"] | "CUSTOM";

interface PeriodSelectorProps {
  selected: Period;
  onSelect: (period: Period) => void;
  customRange: DateRange | undefined;
  onCustomRangeApply: (range: DateRange) => void;
}

export function getDateRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  const from = new Date(now);

  switch (period) {
    case "1W":
      from.setDate(from.getDate() - 7);
      break;
    case "1M":
      from.setMonth(from.getMonth() - 1);
      break;
    case "3M":
      from.setMonth(from.getMonth() - 3);
      break;
    case "6M":
      from.setMonth(from.getMonth() - 6);
      break;
    case "YTD":
      from.setMonth(0, 1);
      break;
    case "1Y":
      from.setFullYear(from.getFullYear() - 1);
      break;
    case "ALL":
      from.setFullYear(2020, 0, 1);
      break;
    case "CUSTOM":
      // Custom range handled externally
      return { from: to, to };
  }

  return { from: from.toISOString().split("T")[0], to };
}

export function PeriodSelector({
  selected,
  onSelect,
  customRange,
  onCustomRangeApply,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          variant={selected === p.value ? "default" : "outline"}
          size="sm"
          className={cn("min-w-[3rem]")}
          onClick={() => onSelect(p.value)}
        >
          {p.label}
        </Button>
      ))}
      <DateRangePicker
        dateRange={customRange}
        onApply={onCustomRangeApply}
        isActive={selected === "CUSTOM"}
      />
    </div>
  );
}
