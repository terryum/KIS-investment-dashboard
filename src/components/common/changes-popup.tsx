"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
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
  detection: ChangeDetectionResult;
}

export function ChangesPopup({ detection }: ChangesPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!detection.isReady || !detection.hasChanges) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    setOpen(true);
  }, [detection.isReady, detection.hasChanges]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  };

  const changes = detection.changes;
  if (!changes || !detection.hasChanges) return null;

  const totalChanges =
    changes.newItems.length +
    changes.removedItems.length +
    changes.quantityChanges.length;

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
                left: `${item.name ?? item.ticker} (${item.ticker})`,
                right: "",
              }))}
              badgeVariant="default"
            />
          )}

          {changes.removedItems.length > 0 && (
            <Section
              title="매도/소멸"
              icon={<ArrowDownRight className="size-4 text-blue-500" />}
              items={changes.removedItems.map((item) => ({
                left: `${item.name ?? item.ticker} (${item.ticker})`,
                right: "",
              }))}
              badgeVariant="destructive"
            />
          )}

          {changes.quantityChanges.length > 0 && (
            <Section
              title="수량 변화"
              icon={<RefreshCw className="size-4 text-amber-500" />}
              items={changes.quantityChanges.map((item) => {
                const diff = item.currentQty - item.previousQty;
                const sign = diff > 0 ? "+" : "";
                return {
                  left: `${item.name ?? item.ticker} (${item.ticker})`,
                  right: `${item.previousQty}주 → ${item.currentQty}주 (${sign}${diff})`,
                };
              })}
              badgeVariant="secondary"
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
            {item.right && (
              <span className="shrink-0 tabular-nums">{item.right}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
