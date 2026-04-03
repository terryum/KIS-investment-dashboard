"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MoneyDisplay } from "@/components/common/money-display";
import type { ForeignCash } from "@/hooks/use-portfolio";

interface CashDetailModalProps {
  krwCash: number;
  foreignCash: ForeignCash[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashDetailModal({
  krwCash,
  foreignCash,
  open,
  onOpenChange,
}: CashDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>현금 상세</DialogTitle>
          <DialogDescription>원화 및 외화 현금 보유 현황</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">원화 (KRW)</span>
            <MoneyDisplay
              amount={krwCash}
              showColor={false}
              className="text-sm font-medium"
            />
          </div>
          {foreignCash.map((fc) => (
            <div
              key={fc.currency}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-muted-foreground">
                {fc.currency}
              </span>
              <MoneyDisplay
                amount={fc.amount}
                currency={fc.currency as "USD" | "EUR" | "CNY"}
                showColor={false}
                className="text-sm font-medium"
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
