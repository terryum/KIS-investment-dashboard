"use client";

import { useState, useMemo } from "react";
import {
  usePortfolioBalance,
  useManualAssets,
  useHoldings,
} from "@/hooks/use-portfolio";
import type { AggregatedHolding } from "@/hooks/use-portfolio";
import { PortfolioSummaryCard } from "@/components/accounts/portfolio-summary-card";
import { AccountAccordion } from "@/components/accounts/account-accordion";
import { ItemDetailModal } from "@/components/accounts/item-detail-modal";
import { AddManualAssetModal } from "@/components/accounts/add-manual-asset-modal";
import { CashDetailModal } from "@/components/accounts/cash-detail-modal";
import { ManualAssetsSummaryCard } from "@/components/dashboard/manual-assets-summary-card";
import { LoadingProgress } from "@/components/common/loading-progress";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function AccountsPage() {
  const balance = usePortfolioBalance();
  const holdings = useHoldings();
  const manualAssets = useManualAssets();

  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showAddManual, setShowAddManual] = useState(false);
  const [showCashDetail, setShowCashDetail] = useState(false);

  const isLoading = balance.isLoading || holdings.isLoading;

  // Compute account-level data from unified balance
  const accounts = useMemo(() => {
    if (!balance.data) return [];

    const accountMap = new Map<
      string,
      {
        accountNo: string;
        accountName: string;
        totalEvaluation: number;
        totalPnl: number;
        domesticHoldings: AggregatedHolding[];
        overseasHoldings: AggregatedHolding[];
        bondHoldings: AggregatedHolding[];
        cashBalance: number;
        foreignCash: { currency: string; amount: number }[];
      }
    >();

    // Process domestic accounts
    for (const acct of balance.data.domestic) {
      const key = acct.account_no;
      const existing = accountMap.get(key) ?? {
        accountNo: key,
        accountName: acct.account_name || `계좌 ${key.slice(-4)}`,
        totalEvaluation: 0,
        totalPnl: 0,
        domesticHoldings: [],
        overseasHoldings: [],
        bondHoldings: [],
        cashBalance: 0,
        foreignCash: [],
      };
      existing.cashBalance += acct.summary.cash_balance;
      existing.totalEvaluation += acct.summary.total_evaluation;
      existing.totalPnl += acct.summary.total_pnl;

      for (const h of acct.holdings) {
        existing.domesticHoldings.push({
          ticker: h.pdno,
          name: h.prdt_name,
          market: "KRX",
          quantity: parseFloat(h.hldg_qty) || 0,
          purchase_amount: parseFloat(h.pchs_amt) || 0,
          evaluation_amount: parseFloat(h.evlu_amt) || 0,
          pnl: parseFloat(h.evlu_pfls_amt) || 0,
          pnl_percent: parseFloat(h.evlu_pfls_rt) || 0,
          currency: "KRW",
          current_price: parseFloat(h.prpr) || 0,
          avg_price: parseFloat(h.pchs_avg_pric) || 0,
        });
      }

      accountMap.set(key, existing);
    }

    // Process overseas accounts
    for (const acct of balance.data.overseas) {
      const key = acct.account_no;
      const existing = accountMap.get(key) ?? {
        accountNo: key,
        accountName: acct.account_name || `계좌 ${key.slice(-4)}`,
        totalEvaluation: 0,
        totalPnl: 0,
        domesticHoldings: [],
        overseasHoldings: [],
        bondHoldings: [],
        cashBalance: 0,
        foreignCash: [],
      };
      existing.totalEvaluation += acct.summary.total_evaluation;
      existing.totalPnl += acct.summary.total_pnl;

      for (const h of acct.holdings) {
        const qty = parseFloat(h.cblc_qty13) || 0;
        const price = parseFloat(h.ovrs_now_pric1) || 0;
        existing.overseasHoldings.push({
          ticker: h.ovrs_pdno,
          name: h.ovrs_item_name,
          market: h.ovrs_excg_cd as "NASD" | "NYSE" | "AMEX",
          quantity: qty,
          purchase_amount: parseFloat(h.frcr_pchs_amt1) || 0,
          evaluation_amount: qty * price,
          pnl: parseFloat(h.frcr_evlu_pfls_amt) || 0,
          pnl_percent: parseFloat(h.evlu_pfls_rt1) || 0,
          currency: h.tr_crcy_cd || "USD",
          current_price: price,
          avg_price: parseFloat(h.pchs_avg_pric) || 0,
        });
      }

      accountMap.set(key, existing);
    }

    // Process bond accounts
    for (const acct of balance.data.bonds) {
      const key = acct.account_no;
      const existing = accountMap.get(key) ?? {
        accountNo: key,
        accountName: acct.account_name || `계좌 ${key.slice(-4)}`,
        totalEvaluation: 0,
        totalPnl: 0,
        domesticHoldings: [],
        overseasHoldings: [],
        bondHoldings: [],
        cashBalance: 0,
        foreignCash: [],
      };

      for (const h of acct.holdings) {
        const evalAmt = parseFloat(h.bond_evlu_amt) || 0;
        const pnl = parseFloat(h.evlu_pfls_amt) || 0;
        const purchaseAmt = parseFloat(h.pchs_amt) || 0;
        existing.totalEvaluation += evalAmt;
        existing.totalPnl += pnl;
        existing.bondHoldings.push({
          ticker: h.pdno,
          name: h.prdt_name,
          market: "BOND",
          quantity: parseFloat(h.bnd_buy_qty) || 0,
          purchase_amount: purchaseAmt,
          evaluation_amount: evalAmt,
          pnl,
          pnl_percent: purchaseAmt > 0 ? (pnl / purchaseAmt) * 100 : 0,
          currency: "KRW",
          current_price: 0,
          avg_price: 0,
        });
      }

      accountMap.set(key, existing);
    }

    // Add foreign cash info
    for (const fc of balance.data.foreignCash) {
      // Add to first account for display
      const firstKey = accountMap.keys().next().value;
      if (firstKey) {
        const acct = accountMap.get(firstKey)!;
        acct.foreignCash.push(fc);
      }
    }

    return Array.from(accountMap.values());
  }, [balance.data]);

  // Totals for summary
  const holdingsList = holdings.data?.holdings ?? [];
  const totalEvaluation = holdingsList.reduce(
    (sum, h) => sum + h.evaluation_amount,
    0,
  );
  const totalPurchase = holdingsList.reduce(
    (sum, h) => sum + h.purchase_amount,
    0,
  );
  const totalPnl = holdingsList.reduce((sum, h) => sum + h.pnl, 0);
  const totalPnlPercent =
    totalPurchase > 0 ? (totalPnl / totalPurchase) * 100 : 0;
  const totalCash = accounts.reduce((sum, a) => sum + a.cashBalance, 0);

  // Find selected holding for detail modal
  const selectedHolding =
    holdingsList.find((h) => h.ticker === selectedTicker) ?? null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">계좌별 현황</h2>
        <LoadingProgress current={0} total={6} label="계좌 데이터 로딩 중" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">계좌별 현황</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddManual(true)}
        >
          <PlusIcon className="mr-1 h-4 w-4" />
          수동 자산 추가
        </Button>
      </div>

      <PortfolioSummaryCard
        totalEvaluation={totalEvaluation}
        totalPurchase={totalPurchase}
        totalPnl={totalPnl}
        totalPnlPercent={totalPnlPercent}
        cashBalance={totalCash}
      />

      <AccountAccordion
        accounts={accounts}
        onHoldingClick={setSelectedTicker}
        onCashClick={() => setShowCashDetail(true)}
      />

      <ManualAssetsSummaryCard
        assets={manualAssets.data}
        isLoading={manualAssets.isLoading}
      />

      <ItemDetailModal
        holding={selectedHolding}
        open={!!selectedTicker}
        onOpenChange={(open) => {
          if (!open) setSelectedTicker(null);
        }}
      />

      <AddManualAssetModal open={showAddManual} onOpenChange={setShowAddManual} />

      <CashDetailModal
        krwCash={totalCash}
        foreignCash={holdings.data?.foreign_cash ?? []}
        open={showCashDetail}
        onOpenChange={setShowCashDetail}
      />
    </div>
  );
}
