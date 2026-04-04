"use client";

import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";

/**
 * Track a React Query loading state in the global UI store.
 * This powers the header progress bar.
 */
export function useLoadingTracker(
  key: string,
  label: string,
  isLoading: boolean,
) {
  const setLoadingItem = useUiStore((s) => s.setLoadingItem);

  useEffect(() => {
    setLoadingItem(key, label, !isLoading);
  }, [key, label, isLoading, setLoadingItem]);
}
