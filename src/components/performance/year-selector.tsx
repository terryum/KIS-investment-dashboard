"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface YearSelectorProps {
  year: number;
  onYearChange: (year: number) => void;
}

export function YearSelector({ year, onYearChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onYearChange(year - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-sm font-medium tabular-nums min-w-[4rem] text-center">
        {year}년
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onYearChange(year + 1)}
        disabled={year >= currentYear}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
