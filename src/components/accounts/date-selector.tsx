"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        max={today}
        className="w-40"
      />
      {selectedDate !== today && (
        <Button variant="outline" size="sm" onClick={() => onDateChange(today)}>
          오늘
        </Button>
      )}
    </div>
  );
}
