"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { JournalFilters } from "./hooks";

const JOURNAL_TYPES = [
  { value: "", label: "전체" },
  { value: "entry", label: "매수" },
  { value: "exit", label: "매도" },
  { value: "note", label: "메모" },
  { value: "review", label: "복기" },
];

interface JournalSearchBarProps {
  filters: JournalFilters;
  onFilterChange: (filters: JournalFilters) => void;
}

export function JournalSearchBar({
  filters,
  onFilterChange,
}: JournalSearchBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="검색..."
          value={filters.q ?? ""}
          onChange={(e) => onFilterChange({ ...filters, q: e.target.value || undefined })}
          className="pl-9"
        />
      </div>
      <Input
        placeholder="종목코드"
        value={filters.ticker ?? ""}
        onChange={(e) => onFilterChange({ ...filters, ticker: e.target.value || undefined })}
        className="w-28 tabular-nums"
      />
      <div className="flex gap-1">
        {JOURNAL_TYPES.map((t) => (
          <Button
            key={t.value}
            variant={(filters.type ?? "") === t.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange({ ...filters, type: t.value || undefined })}
          >
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
