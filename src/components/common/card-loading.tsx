"use client";

import { cn } from "@/lib/utils";

interface CardLoadingProps {
  label?: string;
  className?: string;
}

export function CardLoading({
  label = "로딩 중...",
  className,
}: CardLoadingProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Thin animated bar at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted overflow-hidden">
        <div className="h-full w-1/3 bg-primary animate-slide-loading rounded-full" />
      </div>

      {/* Shimmer content placeholder */}
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
