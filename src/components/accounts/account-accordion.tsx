"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { MoneyDisplay } from "@/components/common/money-display";
import { CategoryCard } from "./category-card";
import type { AggregatedHolding, ForeignCash } from "@/hooks/use-portfolio";

interface AccountData {
  accountNo: string;
  accountName: string;
  totalEvaluation: number;
  totalPnl: number;
  domesticHoldings: AggregatedHolding[];
  overseasHoldings: AggregatedHolding[];
  bondHoldings: AggregatedHolding[];
  cashBalance: number;
  foreignCash: ForeignCash[];
}

interface AccountAccordionProps {
  accounts: AccountData[];
  onHoldingClick?: (ticker: string) => void;
  onCashClick?: () => void;
}

function mapHolding(h: AggregatedHolding) {
  return {
    ticker: h.ticker,
    name: h.name,
    market: h.market as "KRX" | "NASD" | "NYSE" | "AMEX" | "BOND",
    quantity: h.quantity,
    evaluationAmount: h.evaluation_amount,
    purchaseAmount: h.purchase_amount,
    pnl: h.pnl,
    pnlPercent: h.pnl_percent,
    currency: h.currency,
  };
}

export function AccountAccordion({
  accounts,
  onHoldingClick,
  onCashClick,
}: AccountAccordionProps) {
  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        계좌 데이터가 없습니다
      </p>
    );
  }

  return (
    <Accordion defaultValue={[accounts[0]?.accountNo]}>
      {accounts.map((acct) => (
        <AccordionItem key={acct.accountNo} value={acct.accountNo}>
          <AccordionTrigger className="px-2">
            <div className="flex flex-1 items-center justify-between pr-2">
              <span className="font-medium">{acct.accountName}</span>
              <div className="flex items-center gap-3">
                <MoneyDisplay
                  amount={acct.totalEvaluation}
                  showColor={false}
                  className="text-sm font-medium"
                />
                <MoneyDisplay
                  amount={acct.totalPnl}
                  showSign
                  showColor
                  className="text-sm"
                />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 px-2">
            <CategoryCard
              title="국내주식"
              holdings={acct.domesticHoldings.map(mapHolding)}
              onHoldingClick={onHoldingClick}
            />
            <CategoryCard
              title="해외주식"
              holdings={acct.overseasHoldings.map(mapHolding)}
              onHoldingClick={onHoldingClick}
            />
            <CategoryCard
              title="채권"
              holdings={acct.bondHoldings.map(mapHolding)}
              onHoldingClick={onHoldingClick}
            />
            {acct.cashBalance > 0 && (
              <button
                type="button"
                onClick={onCashClick}
                className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
              >
                <span className="text-sm font-medium">현금</span>
                <MoneyDisplay
                  amount={acct.cashBalance}
                  showColor={false}
                  className="text-sm"
                />
              </button>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
