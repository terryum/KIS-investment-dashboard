"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MoneyDisplay } from "@/components/common/money-display";
import { PercentDisplay } from "@/components/common/percent-display";
import { TickerBadge } from "@/components/common/ticker-badge";
import type { AggregatedHolding } from "@/hooks/use-portfolio";

interface ItemDetailModalProps {
  holding: AggregatedHolding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDetailModal({
  holding,
  open,
  onOpenChange,
}: ItemDetailModalProps) {
  if (!holding) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <TickerBadge
              ticker={holding.ticker}
              name={holding.name}
              market={holding.market as "KRX" | "NASD" | "NYSE" | "AMEX" | "BOND"}
            />
          </DialogTitle>
          <DialogDescription>종목 상세 정보</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div>
            <p className="text-xs text-muted-foreground">수량</p>
            <p className="font-[family-name:var(--font-geist-mono)] tabular-nums text-sm">
              {holding.quantity.toLocaleString()}주
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">현재가</p>
            <MoneyDisplay
              amount={holding.current_price}
              currency={holding.currency === "KRW" ? "KRW" : "USD"}
              showColor={false}
              className="text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">평균단가</p>
            <MoneyDisplay
              amount={holding.avg_price}
              currency={holding.currency === "KRW" ? "KRW" : "USD"}
              showColor={false}
              className="text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">평가금액</p>
            <MoneyDisplay
              amount={holding.evaluation_amount}
              currency={holding.currency === "KRW" ? "KRW" : "USD"}
              showColor={false}
              className="text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">매입금액</p>
            <MoneyDisplay
              amount={holding.purchase_amount}
              currency={holding.currency === "KRW" ? "KRW" : "USD"}
              showColor={false}
              className="text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">평가손익</p>
            <div className="flex items-center gap-1">
              <MoneyDisplay
                amount={holding.pnl}
                currency={holding.currency === "KRW" ? "KRW" : "USD"}
                showSign
                showColor
                className="text-sm"
              />
            </div>
            <PercentDisplay value={holding.pnl_percent} className="text-xs" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
