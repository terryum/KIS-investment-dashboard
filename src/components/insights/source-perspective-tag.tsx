"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const perspectiveColors: Record<string, string> = {
  bullish: "bg-red-100 text-red-700 border-red-200",
  bearish: "bg-blue-100 text-blue-700 border-blue-200",
  value: "bg-green-100 text-green-700 border-green-200",
  growth: "bg-purple-100 text-purple-700 border-purple-200",
  macro: "bg-amber-100 text-amber-700 border-amber-200",
  bond: "bg-teal-100 text-teal-700 border-teal-200",
  balanced: "bg-gray-100 text-gray-700 border-gray-200",
};

const perspectiveLabels: Record<string, string> = {
  bullish: "상승",
  bearish: "하락",
  value: "가치",
  growth: "성장",
  macro: "매크로",
  bond: "채권",
  balanced: "균형",
};

interface SourcePerspectiveTagProps {
  perspective: string;
  className?: string;
}

export function SourcePerspectiveTag({
  perspective,
  className,
}: SourcePerspectiveTagProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        perspectiveColors[perspective] ?? perspectiveColors.balanced,
        className,
      )}
    >
      {perspectiveLabels[perspective] ?? perspective}
    </Badge>
  );
}
