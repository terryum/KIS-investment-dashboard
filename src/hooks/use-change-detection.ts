"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useHoldings, type AggregatedHolding } from "@/hooks/use-portfolio";

export interface HoldingSnapshot {
  ticker: string;
  name: string;
  market: string;
  quantity: number;
  evaluation_amount: number;
  currency: string;
}

export interface ChangeItem {
  ticker: string;
  name: string;
  detail: string;
}

export interface CashChange {
  label: string;
  previous: number;
  current: number;
  diff: number;
}

export interface ChangeDetectionResult {
  newItems: ChangeItem[];
  removedItems: ChangeItem[];
  quantityChanges: ChangeItem[];
  cashChanges: CashChange[];
  hasChanges: boolean;
}

interface SnapshotWithHoldings {
  id: string;
  cash_balance: number;
  holding_snapshots: HoldingSnapshot[];
}

async function fetchLatestSnapshotWithHoldings(): Promise<SnapshotWithHoldings | null> {
  const res = await fetch("/api/snapshots/latest-with-holdings", {
    credentials: "include",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export function useChangeDetection() {
  const holdings = useHoldings();

  const { data: snapshotData, isLoading: snapshotLoading } = useQuery({
    queryKey: ["snapshots", "latest-with-holdings"],
    queryFn: fetchLatestSnapshotWithHoldings,
    staleTime: 10 * 60 * 1000,
  });

  const result = useMemo<ChangeDetectionResult>(() => {
    if (!holdings.data || !snapshotData) {
      return { newItems: [], removedItems: [], quantityChanges: [], cashChanges: [], hasChanges: false };
    }

    const currentCash = holdings.data.holdings.reduce((sum, h) => {
      // Cash is tracked separately at the account level, not per-holding
      return sum;
    }, 0);

    return detectChanges(
      holdings.data.holdings,
      snapshotData.holding_snapshots,
      0, // Current cash comes from balance, not holdings
      snapshotData.cash_balance,
    );
  }, [holdings.data, snapshotData]);

  return {
    ...result,
    isReady: !holdings.isLoading && !snapshotLoading && !!holdings.data && !!snapshotData,
  };
}

export function detectChanges(
  currentHoldings: AggregatedHolding[],
  snapshotHoldings: HoldingSnapshot[],
  currentCash: number,
  snapshotCash: number,
): ChangeDetectionResult {
  const newItems: ChangeItem[] = [];
  const removedItems: ChangeItem[] = [];
  const quantityChanges: ChangeItem[] = [];
  const cashChanges: CashChange[] = [];

  const snapshotMap = new Map<string, HoldingSnapshot>();
  for (const h of snapshotHoldings) {
    snapshotMap.set(h.ticker, h);
  }

  const currentMap = new Map<string, AggregatedHolding>();
  for (const h of currentHoldings) {
    currentMap.set(h.ticker, h);
  }

  // New items: in current but not in snapshot
  for (const h of currentHoldings) {
    if (!snapshotMap.has(h.ticker)) {
      newItems.push({
        ticker: h.ticker,
        name: h.name,
        detail: `${h.quantity}주 (${formatKRW(h.evaluation_amount)})`,
      });
    }
  }

  // Removed items: in snapshot but not in current
  for (const h of snapshotHoldings) {
    if (!currentMap.has(h.ticker)) {
      removedItems.push({
        ticker: h.ticker,
        name: h.name,
        detail: `${h.quantity}주 매도/소멸`,
      });
    }
  }

  // Quantity changes: in both but different quantity
  for (const h of currentHoldings) {
    const prev = snapshotMap.get(h.ticker);
    if (prev && prev.quantity !== h.quantity) {
      const diff = h.quantity - prev.quantity;
      const sign = diff > 0 ? "+" : "";
      quantityChanges.push({
        ticker: h.ticker,
        name: h.name,
        detail: `${prev.quantity}주 → ${h.quantity}주 (${sign}${diff})`,
      });
    }
  }

  // Cash changes
  const cashDiff = currentCash - snapshotCash;
  if (Math.abs(cashDiff) > 10000) {
    cashChanges.push({
      label: "현금",
      previous: snapshotCash,
      current: currentCash,
      diff: cashDiff,
    });
  }

  return {
    newItems,
    removedItems,
    quantityChanges,
    cashChanges,
    hasChanges:
      newItems.length > 0 ||
      removedItems.length > 0 ||
      quantityChanges.length > 0 ||
      cashChanges.length > 0,
  };
}

function formatKRW(value: number): string {
  if (Math.abs(value) >= 1_0000_0000) {
    return `${(value / 1_0000_0000).toFixed(1)}억`;
  }
  if (Math.abs(value) >= 1_0000) {
    return `${Math.round(value / 1_0000).toLocaleString()}만`;
  }
  return value.toLocaleString();
}
