"use client";

import { useEffect, useRef } from "react";
import type { AggregatedHolding } from "@/hooks/use-portfolio";

interface AssetRecord {
  ticker: string;
  name: string;
  tags: Record<string, unknown> | null;
}

/**
 * Automatically classifies untagged holdings in the background.
 * Runs once per session after holdings data loads.
 * Skips holdings with manual_override or ai_classified flags.
 */
export function useAutoClassify(
  holdings: AggregatedHolding[] | undefined,
) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!holdings || holdings.length === 0 || hasRun.current) return;
    hasRun.current = true;

    classifyUntaggedHoldings(holdings);
  }, [holdings]);
}

async function classifyUntaggedHoldings(holdings: AggregatedHolding[]) {
  try {
    // 1. Fetch current tags from assets_master
    const tagsRes = await fetch("/api/assets/tags", {
      credentials: "include",
    });
    if (!tagsRes.ok) return;

    const tagsJson = await tagsRes.json();
    const assetRecords: AssetRecord[] = tagsJson.data ?? [];

    // Build a lookup by ticker
    const tagsByTicker = new Map<string, Record<string, unknown> | null>();
    for (const record of assetRecords) {
      tagsByTicker.set(record.ticker, record.tags);
    }

    // 2. Find holdings that need classification
    const unclassified = holdings.filter((h) => {
      const tags = tagsByTicker.get(h.ticker);
      if (!tags) return true; // No record at all
      if (tags.manual_override === true) return false;
      if (tags.ai_classified === true) return false;
      // Check if tags are empty/missing classification
      return !tags.real_asset_class;
    });

    if (unclassified.length === 0) return;

    // 3. Classify each in sequence (avoid hammering the API)
    for (const holding of unclassified) {
      try {
        await fetch("/api/assets/classify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker: holding.ticker,
            name: holding.name,
            market: holding.market,
            save: true,
          }),
        });
      } catch {
        // Silent fail — don't block UI for classification errors
      }
    }
  } catch {
    // Silent fail — auto-classify is best-effort
  }
}
