"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStaleTimeUntil6AM } from "@/lib/utils/cache-time";
import { fetchJsonWithCache } from "@/lib/fetch-with-cache";


async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to post ${url}`);
  const json = await res.json();
  return json.data;
}

// --- Snapshot types ---

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
  realized_pnl_ytd: number | null;
  net_cash_inflow: number | null;
  created_at: string;
}

export function useSnapshots(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();

  return useQuery<Snapshot[]>({
    queryKey: ["snapshots", from, to],
    queryFn: () => fetchJsonWithCache(`/api/snapshots${qs ? `?${qs}` : ""}`),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useLatestSnapshot() {
  return useQuery<Snapshot>({
    queryKey: ["snapshots", "latest"],
    queryFn: () => fetchJsonWithCache("/api/snapshots/latest"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useCaptureSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (label?: string) =>
      postJson<Snapshot>("/api/snapshots/capture", { label }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["snapshots"] });
    },
  });
}

// --- Cash flow types ---

export interface CashFlow {
  id: string;
  date: string;
  account_no: string;
  flow_type: string;
  amount: number;
  currency: string;
  description: string | null;
  is_investment_related: boolean;
  created_at: string;
}

export interface MonthlyCashFlow {
  month: string;
  total_inflow: number;
  total_outflow: number;
  net_flow: number;
}

export function useCashFlows(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();

  return useQuery<CashFlow[]>({
    queryKey: ["cash-flows", from, to],
    queryFn: () => fetchJsonWithCache(`/api/cash-flows${qs ? `?${qs}` : ""}`),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useMonthlyCashFlows() {
  return useQuery<MonthlyCashFlow[]>({
    queryKey: ["cash-flows", "monthly"],
    queryFn: () => fetchJsonWithCache("/api/cash-flows/monthly"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useCreateCashFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<CashFlow, "id" | "created_at">) =>
      postJson<CashFlow>("/api/cash-flows", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-flows"] });
    },
  });
}

// --- Income types ---

export interface Income {
  id: string;
  date: string;
  account_no: string;
  ticker: string | null;
  name: string | null;
  type: string;
  amount: number;
  currency: string;
  tax: number | null;
  created_at: string;
}

export interface IncomeSummary {
  year: number;
  type: string;
  total_amount: number;
  count: number;
}

export function useIncome(year?: number, type?: string) {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (type) params.set("type", type);
  const qs = params.toString();

  return useQuery<Income[]>({
    queryKey: ["income", year, type],
    queryFn: () => fetchJsonWithCache(`/api/income${qs ? `?${qs}` : ""}`),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useIncomeSummary(year?: number) {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  const qs = params.toString();

  return useQuery<IncomeSummary[]>({
    queryKey: ["income", "summary", year],
    queryFn: () => fetchJsonWithCache(`/api/income/summary${qs ? `?${qs}` : ""}`),
    staleTime: getStaleTimeUntil6AM(),
  });
}
