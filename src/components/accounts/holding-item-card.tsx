"use client";

import { MoneyDisplay } from "@/components/common/money-display";
import { PercentDisplay } from "@/components/common/percent-display";
import { TickerBadge } from "@/components/common/ticker-badge";

interface HoldingItemCardProps {
  ticker: string;
  name: string;
  market?: "KRX" | "NASD" | "NYSE" | "AMEX" | "BOND";
  quantity: number;
  evaluationAmount: number;
  purchaseAmount: number;
  pnl: number;
  pnlPercent: number;
  currency: string;
  onClick?: () => void;
}

export function HoldingItemCard({
  ticker,
  name,
  market,
  quantity,
  evaluationAmount,
  pnl,
  pnlPercent,
  currency,
  onClick,
}: HoldingItemCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        <TickerBadge ticker={ticker} name={name} market={market} />
        <p className="mt-1 text-xs text-muted-foreground">
          {quantity.toLocaleString()}주
        </p>
      </div>
      <div className="text-right shrink-0 ml-4">
        <MoneyDisplay
          amount={evaluationAmount}
          currency={currency === "KRW" ? "KRW" : "USD"}
          showColor={false}
          className="text-sm font-medium"
        />
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <MoneyDisplay
            amount={pnl}
            currency={currency === "KRW" ? "KRW" : "USD"}
            showSign
            showColor
            className="text-xs"
          />
          <PercentDisplay value={pnlPercent} className="text-xs" />
        </div>
      </div>
    </button>
  );
}
