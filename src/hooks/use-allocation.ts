"use client";

import { useQuery } from "@tanstack/react-query";
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
    staleTime: 5 * 60 * 1000,
  });
}

export function useCountryAllocation() {
  return useQuery({
    queryKey: ["allocation", "country"],
    queryFn: () => fetchJson<AllocationResult>("/api/allocation/country"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrencyAllocation() {
  return useQuery({
    queryKey: ["allocation", "currency"],
    queryFn: () => fetchJson<AllocationResult>("/api/allocation/currency"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStockStructure() {
  return useQuery({
    queryKey: ["allocation", "stock-structure"],
    queryFn: () => fetchJson<AllocationResult>("/api/allocation/stock-structure"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBondStructure() {
  return useQuery({
    queryKey: ["allocation", "bond-structure"],
    queryFn: () => fetchJson<AllocationResult>("/api/allocation/bond-structure"),
    staleTime: 5 * 60 * 1000,
  });
}
