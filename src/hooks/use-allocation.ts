"use client";

import { useQuery } from "@tanstack/react-query";
import { getStaleTimeUntil6AM } from "@/lib/utils/cache-time";
import { fetchJsonWithCache } from "@/lib/fetch-with-cache";
import type { AllocationResult } from "@/lib/allocation/types";


export function useAssetClassAllocation() {
  return useQuery({
    queryKey: ["allocation", "asset-class"],
    queryFn: () => fetchJsonWithCache<AllocationResult>("/api/allocation/asset-class"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useCountryAllocation() {
  return useQuery({
    queryKey: ["allocation", "country"],
    queryFn: () => fetchJsonWithCache<AllocationResult>("/api/allocation/country"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useCurrencyAllocation() {
  return useQuery({
    queryKey: ["allocation", "currency"],
    queryFn: () => fetchJsonWithCache<AllocationResult>("/api/allocation/currency"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useStockStructure() {
  return useQuery({
    queryKey: ["allocation", "stock-structure"],
    queryFn: () => fetchJsonWithCache<AllocationResult>("/api/allocation/stock-structure"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useBondStructure() {
  return useQuery({
    queryKey: ["allocation", "bond-structure"],
    queryFn: () => fetchJsonWithCache<AllocationResult>("/api/allocation/bond-structure"),
    staleTime: getStaleTimeUntil6AM(),
  });
}
