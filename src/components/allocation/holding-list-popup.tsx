"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoneyDisplay } from "@/components/common/money-display";
import { TickerBadge } from "@/components/common/ticker-badge";
import type { AllocationItem } from "@/lib/allocation/types";

interface HoldingListPopupProps {
  label: string;
  items: AllocationItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HoldingListPopup({
  label,
  items,
  open,
  onOpenChange,
}: HoldingListPopupProps) {
  const total = items.reduce((sum, i) => sum + i.evaluation_amount, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{label} 구성종목</SheetTitle>
          <SheetDescription>
            {items.length}종목 /{" "}
            <MoneyDisplay
              amount={total}
              showColor={false}
              className="text-sm inline"
            />
          </SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>종목</TableHead>
                <TableHead className="text-right">평가금액</TableHead>
                <TableHead className="text-right">비중</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items
                .sort((a, b) => b.evaluation_amount - a.evaluation_amount)
                .map((item) => (
                  <TableRow key={item.ticker}>
                    <TableCell>
                      <TickerBadge ticker={item.ticker} name={item.name} />
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay
                        amount={item.evaluation_amount}
                        showColor={false}
                        className="text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-geist-mono)] tabular-nums">
                      {total > 0
                        ? ((item.evaluation_amount / total) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
