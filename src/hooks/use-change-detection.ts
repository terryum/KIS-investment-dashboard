"use client";

import { useEffect, useState } from "react";
import type { SnapshotChanges } from "@/lib/snapshot";

export interface ChangeDetectionResult {
  changes: SnapshotChanges | null;
  hasChanges: boolean;
  isReady: boolean;
}

/**
 * Read change detection results computed server-side by load-today.
 * The prefetch hook stores the changes in sessionStorage after calling load-today.
 */
export function useChangeDetection(): ChangeDetectionResult {
  const [changes, setChanges] = useState<SnapshotChanges | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("snapshot-changes");
    if (stored) {
      try {
        setChanges(JSON.parse(stored));
      } catch {
        // Corrupted data — ignore
      }
    }
    setIsReady(true);
  }, []);

  const hasChanges =
    changes !== null &&
    (changes.newItems.length > 0 ||
      changes.removedItems.length > 0 ||
      changes.quantityChanges.length > 0);

  return { changes, hasChanges, isReady };
}
