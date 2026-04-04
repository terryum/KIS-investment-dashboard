"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

type SnapshotSource = "fresh" | "cache" | "fallback" | null;

function useSnapshotSource() {
  const [source, setSource] = useState<SnapshotSource>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const s = sessionStorage.getItem("snapshot-source") as SnapshotSource;
    setSource(s);
    setLastUpdated(sessionStorage.getItem("snapshot-last-updated"));
  }, []);

  return { source, lastUpdated };
}

function SnapshotBadge() {
  const { source, lastUpdated } = useSnapshotSource();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-hide "fresh" and "cache" badges after 3 seconds
    if (source === "fresh" || source === "cache") {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [source]);

  if (!source || !visible) return null;

  if (source === "fallback") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        마지막 업데이트: {lastUpdated ?? "이전"}
      </span>
    );
  }

  if (source === "fresh") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-fade-out">
        방금 업데이트
      </span>
    );
  }

  if (source === "cache") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-fade-out">
        오늘 데이터
      </span>
    );
  }

  return null;
}

export function AppHeader() {
  const today = format(new Date(), "yyyy년 M월 d일 (EEE)", { locale: ko });
  const loadingItems = useUiStore((s) => s.loadingItems);
  const getLoadingProgress = useUiStore((s) => s.getLoadingProgress);

  const total = loadingItems.length;
  const loaded = loadingItems.filter((i) => i.loaded).length;
  const progress = getLoadingProgress();
  const isLoading = total > 0 && loaded < total;

  // Brief "로딩 완료" display after all items load
  const [showComplete, setShowComplete] = useState(false);
  useEffect(() => {
    if (total > 0 && loaded === total) {
      setShowComplete(true);
      const timer = setTimeout(() => setShowComplete(false), 1500);
      return () => clearTimeout(timer);
    }
    setShowComplete(false);
  }, [total, loaded]);

  return (
    <header className="relative">
      <div className="flex items-center justify-between h-14 px-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold md:hidden">KIS 투자관리</h1>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {today}
          </span>
          <SnapshotBadge />
        </div>

        <div className="flex items-center gap-1">
          {isLoading && (
            <span className="text-xs text-muted-foreground mr-2 tabular-nums">
              {loadingItems.find((i) => !i.loaded)?.label ?? "데이터"} 조회 중... ({loaded}/{total})
            </span>
          )}
          {showComplete && !isLoading && (
            <span className="text-xs text-green-600 mr-2 animate-fade-out">
              로딩 완료
            </span>
          )}
          <span className="text-sm text-muted-foreground sm:hidden">
            {today}
          </span>
          <Button variant="ghost" size="icon">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Link href="/settings" className="md:hidden">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Thin progress bar under header */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </header>
  );
}
