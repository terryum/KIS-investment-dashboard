"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Prefetch all dashboard data in parallel.
 * Call this immediately after PIN verification to start loading
 * while the user is being redirected to the dashboard.
 */
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  return useCallback(() => {
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

    // Fire all prefetches in parallel — don't await
    prefetchQuery(["holdings", "current", "all"], "/api/holdings/current", 2 * 60 * 1000);
    prefetchQuery(["manual-assets"], "/api/manual-assets", 5 * 60 * 1000);
    prefetchQuery(["snapshots", "latest"], "/api/snapshots/latest", 10 * 60 * 1000);
    prefetchQuery(["snapshots", undefined, undefined], "/api/snapshots", 10 * 60 * 1000);
    prefetchQuery(["income", "summary", "all"], "/api/income/summary", 10 * 60 * 1000);
    prefetchQuery(["allocation", "asset-class"], "/api/allocation/asset-class", 5 * 60 * 1000);

    // Auto daily snapshot on first login
    fetch("/api/snapshots/auto", {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Silent fail — snapshot is best-effort
    });
  }, [queryClient]);
}
