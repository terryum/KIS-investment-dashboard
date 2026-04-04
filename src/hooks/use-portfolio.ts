"use client";

import { useQuery } from "@tanstack/react-query";
import { getStaleTimeUntil6AM } from "@/lib/utils/cache-time";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const json = await res.json();
  return json.data;
}

// --- Balance ---

export interface DomesticHolding {
  pdno: string;
  prdt_name: string;
  hldg_qty: string;
  pchs_amt: string;
  evlu_amt: string;
  evlu_pfls_amt: string;
  evlu_pfls_rt: string;
  prpr: string;
  pchs_avg_pric: string;
}

export interface DomesticAccount {
  account_no: string;
  account_name: string;
  holdings: DomesticHolding[];
  summary: {
    total_evaluation: number;
    total_purchase: number;
    total_pnl: number;
    total_pnl_percent: number;
    cash_balance: number;
  };
}

export interface OverseasHolding {
  ovrs_pdno: string;
  ovrs_item_name: string;
  cblc_qty13: string;
  frcr_pchs_amt1: string;
  ovrs_now_pric1: string;
  frcr_evlu_pfls_amt: string;
  evlu_pfls_rt1: string;
  pchs_avg_pric: string;
  tr_crcy_cd: string;
  ovrs_excg_cd: string;
}

export interface OverseasAccount {
  account_no: string;
  account_name: string;
  exchange: string;
  holdings: OverseasHolding[];
  summary: {
    total_evaluation: number;
    total_purchase: number;
    total_pnl: number;
    total_pnl_percent: number;
  };
}

export interface BondHolding {
  pdno: string;
  prdt_name: string;
  bnd_buy_qty: string;
  pchs_amt: string;
  bond_evlu_amt: string;
  evlu_pfls_amt: string;
}

export interface BondAccount {
  account_no: string;
  account_name: string;
  holdings: BondHolding[];
}

export interface ForeignCash {
  currency: string;
  amount: number;
}

export interface UnifiedBalance {
  domestic: DomesticAccount[];
  overseas: OverseasAccount[];
  bonds: BondAccount[];
  foreignCash: ForeignCash[];
}

export function usePortfolioBalance(accountNo?: string) {
  const url = accountNo
    ? `/api/kis/balance?account_no=${accountNo}`
    : "/api/kis/balance";
  return useQuery({
    queryKey: ["portfolio", "balance", accountNo ?? "all"],
    queryFn: () => fetchJson<UnifiedBalance>(url),
    staleTime: getStaleTimeUntil6AM(),
  });
}

// --- Aggregated Holdings ---

export interface AggregatedHolding {
  ticker: string;
  name: string;
  market: string;
  quantity: number;
  purchase_amount: number;
  evaluation_amount: number;
  pnl: number;
  pnl_percent: number;
  currency: string;
  current_price: number;
  avg_price: number;
}

export interface HoldingsData {
  holdings: AggregatedHolding[];
  foreign_cash: ForeignCash[];
}

export function useHoldings(accountNo?: string) {
  const url = accountNo
    ? `/api/holdings/current?account_no=${accountNo}`
    : "/api/holdings/current";
  return useQuery({
    queryKey: ["holdings", "current", accountNo ?? "all"],
    queryFn: () => fetchJson<HoldingsData>(url),
    staleTime: getStaleTimeUntil6AM(),
  });
}

// --- Manual Assets ---

export interface ManualAsset {
  id: string;
  category: string;
  name: string;
  current_value: number;
  currency: string;
  is_liability: boolean;
  account_no: string | null;
  purchase_amount: number | null;
  valued_at: string | null;
  metadata: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  last_updated_at: string;
}

export function useManualAssets() {
  return useQuery({
    queryKey: ["manual-assets"],
    queryFn: () => fetchJson<ManualAsset[]>("/api/manual-assets"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

// --- Snapshots ---

export interface Snapshot {
  id: string;
  date: string;
  snapshot_type: string;
  label: string | null;
  total_value: number;
  total_invested: number;
  cash_balance: number;
  manual_assets_total: number;
  unrealized_pnl: number;
  realized_pnl_ytd: number;
  net_cash_inflow: number;
  created_at: string;
}

export function useLatestSnapshot() {
  return useQuery({
    queryKey: ["snapshots", "latest"],
    queryFn: () => fetchJson<Snapshot>("/api/snapshots/latest"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useSnapshots(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return useQuery({
    queryKey: ["snapshots", from, to],
    queryFn: () => fetchJson<Snapshot[]>(`/api/snapshots${qs ? `?${qs}` : ""}`),
    staleTime: getStaleTimeUntil6AM(),
  });
}

// --- Income Summary ---

export interface IncomeSummary {
  year: number;
  type: string;
  total_amount: number;
  count: number;
}

export function useIncomeSummary(year?: number) {
  const url = year
    ? `/api/income/summary?year=${year}`
    : "/api/income/summary";
  return useQuery({
    queryKey: ["income", "summary", year ?? "all"],
    queryFn: () => fetchJson<IncomeSummary[]>(url),
    staleTime: getStaleTimeUntil6AM(),
  });
}
