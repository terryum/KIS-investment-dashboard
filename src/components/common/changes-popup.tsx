"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, RefreshCw, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { ChangeDetectionResult } from "@/hooks/use-change-detection";

const SESSION_KEY = "changes-popup-dismissed";

interface ChangesPopupProps {
  changes: ChangeDetectionResult;
  isReady: boolean;
}

export function ChangesPopup({ changes, isReady }: ChangesPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isReady || !changes.hasChanges) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    setOpen(true);
  }, [isReady, changes.hasChanges]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  };

  if (!changes.hasChanges) return null;

  const totalChanges =
    changes.newItems.length +
    changes.removedItems.length +
    changes.quantityChanges.length +
    changes.cashChanges.length;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            마지막 스냅샷 이후 변동사항 ({totalChanges}건)
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-80 space-y-4 overflow-y-auto">
          {changes.newItems.length > 0 && (
            <Section
              title="신규 매수"
              icon={<ArrowUpRight className="size-4 text-red-500" />}
              items={changes.newItems.map((item) => ({
                left: `${item.name} (${item.ticker})`,
                right: item.detail,
              }))}
              badgeVariant="default"
            />
          )}

          {changes.removedItems.length > 0 && (
            <Section
              title="매도/소멸"
              icon={<ArrowDownRight className="size-4 text-blue-500" />}
              items={changes.removedItems.map((item) => ({
                left: `${item.name} (${item.ticker})`,
                right: item.detail,
              }))}
              badgeVariant="destructive"
            />
          )}

          {changes.quantityChanges.length > 0 && (
            <Section
              title="수량 변화"
              icon={<RefreshCw className="size-4 text-amber-500" />}
              items={changes.quantityChanges.map((item) => ({
                left: `${item.name} (${item.ticker})`,
                right: item.detail,
              }))}
              badgeVariant="secondary"
            />
          )}

          {changes.cashChanges.length > 0 && (
            <Section
              title="현금 유입/유출"
              icon={<Banknote className="size-4 text-emerald-500" />}
              items={changes.cashChanges.map((item) => ({
                left: item.label,
                right: `${item.diff > 0 ? "+" : ""}${formatKRW(item.diff)}`,
              }))}
              badgeVariant="outline"
            />
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleDismiss}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  icon,
  items,
  badgeVariant,
}: {
  title: string;
  icon: React.ReactNode;
  items: { left: string; right: string }[];
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{title}</span>
        <Badge variant={badgeVariant}>{items.length}</Badge>
      </div>
      <div className="space-y-1 pl-6">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-muted-foreground">{item.left}</span>
            <span className="shrink-0 tabular-nums">{item.right}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatKRW(value: number): string {
  if (Math.abs(value) >= 1_0000_0000) {
    return `${(value / 1_0000_0000).toFixed(1)}억원`;
  }
  if (Math.abs(value) >= 1_0000) {
    return `${Math.round(value / 1_0000).toLocaleString()}만원`;
  }
  return `${value.toLocaleString()}원`;
}
