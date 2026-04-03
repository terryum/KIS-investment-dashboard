"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoneyDisplay } from "@/components/common/money-display";
import type { AllocationSlice } from "@/lib/allocation/types";

interface AllocationDetailTableProps {
  slices: AllocationSlice[];
  total: number;
  onRowClick?: (label: string) => void;
}

export function AllocationDetailTable({
  slices,
  total,
  onRowClick,
}: AllocationDetailTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>구분</TableHead>
          <TableHead className="text-right">금액</TableHead>
          <TableHead className="text-right">비중</TableHead>
          <TableHead className="text-right">종목수</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {slices.map((slice) => (
          <TableRow
            key={slice.label}
            className="cursor-pointer"
            onClick={() => onRowClick?.(slice.label)}
          >
            <TableCell className="font-medium">{slice.label}</TableCell>
            <TableCell className="text-right">
              <MoneyDisplay
                amount={slice.value}
                showColor={false}
                className="text-sm"
              />
            </TableCell>
            <TableCell className="text-right font-[family-name:var(--font-geist-mono)] tabular-nums">
              {slice.percent.toFixed(1)}%
            </TableCell>
            <TableCell className="text-right font-[family-name:var(--font-geist-mono)] tabular-nums">
              {slice.items.length}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="font-bold">
          <TableCell>합계</TableCell>
          <TableCell className="text-right">
            <MoneyDisplay
              amount={total}
              showColor={false}
              className="text-sm font-bold"
            />
          </TableCell>
          <TableCell className="text-right font-[family-name:var(--font-geist-mono)] tabular-nums">
            100.0%
          </TableCell>
          <TableCell className="text-right font-[family-name:var(--font-geist-mono)] tabular-nums">
            {slices.reduce((sum, s) => sum + s.items.length, 0)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
