"use client";

import { cn } from "@/lib/utils";

interface PercentDisplayProps {
  value: number;
  decimals?: number;
  showSign?: boolean;
  showColor?: boolean;
  className?: string;
}

export function PercentDisplay({
  value,
  decimals = 2,
  showSign = true,
  showColor = true,
  className,
}: PercentDisplayProps) {
  const sign = value > 0 ? "+" : "";
  const formatted = `${showSign ? sign : ""}${value.toFixed(decimals)}%`;

  return (
    <span
      className={cn(
        "font-[family-name:var(--font-geist-mono)] tabular-nums",
        showColor && value > 0 && "text-red-500",
        showColor && value < 0 && "text-blue-500",
        showColor && value === 0 && "text-gray-500",
        className,
      )}
    >
      {formatted}
    </span>
  );
}
