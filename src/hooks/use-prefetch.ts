"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getStaleTimeUntil6AM } from "@/lib/utils/cache-time";

/**
 * Prefetch all dashboard data.
 * 1. Call load-today (the ONE heavy call — creates/loads today's snapshot)
 * 2. Then prefetch remaining queries in parallel (all read from Supabase, fast)
 */
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    const opts = { credentials: "include" as RequestCredentials };

    const prefetchQuery = (key: unknown[], url: string, staleTime: number) =>
      queryClient.prefetchQuery({
        queryKey: key,
        queryFn: async () => {
          const res = await fetch(url, opts);
          if (!res.ok) return null;
          const json = await res.json();
          return json.data;
        },
        staleTime,
      });

    // Step 1: Load today's snapshot (creates if needed, KIS called only if no snapshot)
    try {
      const loadRes = await fetch("/api/snapshots/load-today", {
        method: "POST",
        credentials: "include",
      });
      const loadData = await loadRes.json();

      if (loadData.data?.changes) {
        sessionStorage.setItem("snapshot-changes", JSON.stringify(loadData.data.changes));
      }
      if (loadData.data?.source) {
        sessionStorage.setItem("snapshot-source", loadData.data.source);
      }
      if (loadData.data?.lastUpdated) {
        sessionStorage.setItem("snapshot-last-updated", loadData.data.lastUpdated);
      }
    } catch {
      // Silent fail — snapshot is best-effort
    }

    // Step 2: Prefetch remaining data in parallel (all read from Supabase, fast)
    const stale = getStaleTimeUntil6AM();
    prefetchQuery(["holdings", "current", "all"], "/api/holdings/current", stale);
    prefetchQuery(["manual-assets"], "/api/manual-assets", stale);
    prefetchQuery(["snapshots", "latest"], "/api/snapshots/latest", stale);
    prefetchQuery(["snapshots", undefined, undefined], "/api/snapshots", stale);
    prefetchQuery(["income", "summary", "all"], "/api/income/summary", stale);
    prefetchQuery(["allocation", "asset-class"], "/api/allocation/asset-class", stale);
  }, [queryClient]);
}
