"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/common/money-display";
import { PercentDisplay } from "@/components/common/percent-display";
import { Pencil, Trash2 } from "lucide-react";
import type { Journal } from "./hooks";
import { useDeleteJournal } from "./hooks";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  entry: "매수",
  exit: "매도",
  note: "메모",
  review: "복기",
};

const typeColors: Record<string, string> = {
  entry: "bg-red-100 text-red-700 border-red-200",
  exit: "bg-blue-100 text-blue-700 border-blue-200",
  note: "bg-gray-100 text-gray-700 border-gray-200",
  review: "bg-purple-100 text-purple-700 border-purple-200",
};

interface JournalDetailModalProps {
  journal: Journal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (journal: Journal) => void;
}

export function JournalDetailModal({
  journal,
  open,
  onOpenChange,
  onEdit,
}: JournalDetailModalProps) {
  const deleteJournal = useDeleteJournal();

  if (!journal) return null;

  const handleDelete = () => {
    deleteJournal.mutate(journal.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", typeColors[journal.type])}
            >
              {typeLabels[journal.type] ?? journal.type}
            </Badge>
            {journal.ticker && (
              <Badge variant="outline" className="text-xs">
                {journal.ticker}
              </Badge>
            )}
          </div>
          <DialogTitle>{journal.title}</DialogTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {new Date(journal.created_at).toLocaleString("ko-KR")}
          </span>
        </DialogHeader>

        {journal.content && (
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {journal.content}
          </div>
        )}

        {(journal.entry_price != null ||
          journal.target_price != null ||
          journal.stop_loss_price != null) && (
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-sm font-medium">가격 정보</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {journal.entry_price != null && (
                <div>
                  <span className="text-muted-foreground">진입가</span>
                  <div className="tabular-nums">
                    {journal.entry_price.toLocaleString()}
                  </div>
                </div>
              )}
              {journal.target_price != null && (
                <div>
                  <span className="text-muted-foreground">목표가</span>
                  <div className="tabular-nums text-red-500">
                    {journal.target_price.toLocaleString()}
                  </div>
                </div>
              )}
              {journal.stop_loss_price != null && (
                <div>
                  <span className="text-muted-foreground">손절가</span>
                  <div className="tabular-nums text-blue-500">
                    {journal.stop_loss_price.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(journal.exit_price != null || journal.realized_return != null) && (
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-sm font-medium">결과</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {journal.exit_price != null && (
                <div>
                  <span className="text-muted-foreground">청산가</span>
                  <div className="tabular-nums">
                    {journal.exit_price.toLocaleString()}
                  </div>
                </div>
              )}
              {journal.realized_return != null && (
                <div>
                  <span className="text-muted-foreground">실현수익률</span>
                  <PercentDisplay value={journal.realized_return} />
                </div>
              )}
              {journal.holding_days != null && (
                <div>
                  <span className="text-muted-foreground">보유일수</span>
                  <div className="tabular-nums">{journal.holding_days}일</div>
                </div>
              )}
            </div>
          </div>
        )}

        {journal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t pt-3">
            {journal.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs bg-muted">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={handleDelete}
            disabled={deleteJournal.isPending}
          >
            <Trash2 className="mr-1 size-3.5" />
            삭제
          </Button>
          <Button size="sm" onClick={() => onEdit(journal)}>
            <Pencil className="mr-1 size-3.5" />
            수정
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
