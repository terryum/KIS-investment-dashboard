"use client";

import { cn } from "@/lib/utils";

interface LoadingProgressProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

export function LoadingProgress({
  current,
  total,
  label = "계좌 로딩 중",
  className,
}: LoadingProgressProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {label} ({current}/{total})
        </span>
        <span className="font-[family-name:var(--font-geist-mono)] tabular-nums">
          {percent}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
