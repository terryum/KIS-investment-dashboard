"use client";

import { useQuery } from "@tanstack/react-query";
import { getStaleTimeUntil6AM } from "@/lib/utils/cache-time";
import type { AllocationResult } from "@/lib/allocation/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const json = await res.json();
  return json.data;
}

export function useAssetClassAllocation() {
  return useQuery({
    queryKey: ["allocation", "asset-class"],
    queryFn: () => fetchJson<AllocationResult>("/api/allocation/asset-class"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useCountryAllocation() {
  return useQuery({
    queryKey: ["allocation", "country"],
    queryFn: () => fetchJson<AllocationResult>("/api/allocation/country"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useCurrencyAllocation() {
  return useQuery({
    queryKey: ["allocation", "currency"],
    queryFn: () => fetchJson<AllocationResult>("/api/allocation/currency"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useStockStructure() {
  return useQuery({
    queryKey: ["allocation", "stock-structure"],
    queryFn: () => fetchJson<AllocationResult>("/api/allocation/stock-structure"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useBondStructure() {
  return useQuery({
    queryKey: ["allocation", "bond-structure"],
    queryFn: () => fetchJson<AllocationResult>("/api/allocation/bond-structure"),
    staleTime: getStaleTimeUntil6AM(),
  });
}
