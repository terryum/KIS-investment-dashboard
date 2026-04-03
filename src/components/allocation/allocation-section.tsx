"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart } from "./donut-chart";
import { AllocationDetailTable } from "./allocation-detail-table";
import { HoldingListPopup } from "./holding-list-popup";
import type { AllocationResult, AllocationSlice } from "@/lib/allocation/types";

interface AllocationSectionProps {
  title: string;
  data?: AllocationResult;
  colors?: Record<string, string>;
  isLoading?: boolean;
}

export function AllocationSection({
  title,
  data,
  colors,
  isLoading,
}: AllocationSectionProps) {
  const [selectedSlice, setSelectedSlice] = useState<AllocationSlice | null>(
    null,
  );

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="h-[200px] w-[200px] animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-5 animate-pulse rounded bg-muted"
                  style={{ width: `${80 - i * 10}%` }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function handleSliceClick(label: string) {
    const slice = data!.slices.find((s) => s.label === label);
    if (slice) setSelectedSlice(slice);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DonutChart
            slices={data.slices}
            colors={colors}
            onSliceClick={handleSliceClick}
          />
          <AllocationDetailTable
            slices={data.slices}
            total={data.total}
            onRowClick={handleSliceClick}
          />
        </CardContent>
      </Card>

      <HoldingListPopup
        label={selectedSlice?.label ?? ""}
        items={selectedSlice?.items ?? []}
        open={!!selectedSlice}
        onOpenChange={(open) => {
          if (!open) setSelectedSlice(null);
        }}
      />
    </>
  );
}
