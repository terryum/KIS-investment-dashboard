"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TickerBadgeProps {
  ticker: string;
  name?: string;
  market?: "KRX" | "NASD" | "NYSE" | "AMEX" | "BOND";
  className?: string;
}

const marketColors: Record<string, string> = {
  KRX: "bg-blue-100 text-blue-700 border-blue-200",
  NASD: "bg-purple-100 text-purple-700 border-purple-200",
  NYSE: "bg-green-100 text-green-700 border-green-200",
  AMEX: "bg-orange-100 text-orange-700 border-orange-200",
  BOND: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function TickerBadge({
  ticker,
  name,
  market,
  className,
}: TickerBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {market && (
        <Badge
          variant="outline"
          className={cn("text-[10px] px-1 py-0", marketColors[market])}
        >
          {market}
        </Badge>
      )}
      <span className="font-[family-name:var(--font-geist-mono)] text-sm tabular-nums">
        {ticker}
      </span>
      {name && (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {name}
        </span>
      )}
    </span>
  );
}
