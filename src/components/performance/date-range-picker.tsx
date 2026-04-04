"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onApply: (range: DateRange) => void;
  isActive: boolean;
}

export function DateRangePicker({
  dateRange,
  onApply,
  isActive,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DateRange | undefined>(dateRange);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setSelected(dateRange);
    }
  };

  const handleApply = () => {
    if (selected?.from && selected?.to) {
      onApply(selected);
      setOpen(false);
    }
  };

  const displayText =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "yyyy.MM.dd")} ~ ${format(dateRange.to, "yyyy.MM.dd")}`
      : "기간 설정";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn("min-w-[3rem] gap-1.5")}
          />
        }
      >
        <CalendarIcon className="size-3.5" />
        {displayText}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={setSelected}
          numberOfMonths={2}
          locale={ko}
          disabled={{ after: new Date() }}
          defaultMonth={
            selected?.from
              ? new Date(selected.from.getFullYear(), selected.from.getMonth() - 1)
              : new Date(new Date().getFullYear(), new Date().getMonth() - 1)
          }
        />
        <div className="flex justify-end gap-2 border-t pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            disabled={!selected?.from || !selected?.to}
            onClick={handleApply}
          >
            적용
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
