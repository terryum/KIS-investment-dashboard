"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type CacheStatus = "fresh" | "stale" | "offline";

interface CacheStatusBadgeProps {
  status: CacheStatus;
  /** Timestamp (ms) when data was last fetched */
  updatedAt?: number;
  className?: string;
}

function getTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

export function CacheStatusBadge({
  status,
  updatedAt,
  className,
}: CacheStatusBadgeProps) {
  const label =
    status === "fresh"
      ? "실시간"
      : status === "offline"
        ? "오프라인"
        : updatedAt
          ? getTimeAgo(updatedAt)
          : "캐시됨";

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        status === "fresh" && "border-green-500 text-green-600",
        status === "stale" && "border-yellow-500 text-yellow-600",
        status === "offline" && "border-gray-400 text-gray-500",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
