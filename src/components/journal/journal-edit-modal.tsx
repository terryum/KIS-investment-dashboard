"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateJournal, useUpdateJournal, type Journal } from "./hooks";

const JOURNAL_TYPES = [
  { value: "entry", label: "매수" },
  { value: "exit", label: "매도" },
  { value: "note", label: "메모" },
  { value: "review", label: "복기" },
];

interface JournalEditModalProps {
  journal: Journal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JournalEditModal({
  journal,
  open,
  onOpenChange,
}: JournalEditModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState("note");
  const [entryPrice, setEntryPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const createJournal = useCreateJournal();
  const updateJournal = useUpdateJournal();

  const isEditing = !!journal;

  useEffect(() => {
    if (journal) {
      setTitle(journal.title);
      setContent(journal.content ?? "");
      setTicker(journal.ticker ?? "");
      setType(journal.type);
      setEntryPrice(journal.entry_price?.toString() ?? "");
      setTargetPrice(journal.target_price?.toString() ?? "");
      setStopLossPrice(journal.stop_loss_price?.toString() ?? "");
      setTagsInput(journal.tags.join(", "));
    } else {
      setTitle("");
      setContent("");
      setTicker("");
      setType("note");
      setEntryPrice("");
      setTargetPrice("");
      setStopLossPrice("");
      setTagsInput("");
    }
  }, [journal, open]);

  const handleSubmit = () => {
    if (!title || !type) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = {
      title,
      content: content || null,
      ticker: ticker || null,
      type,
      entry_price: entryPrice ? parseFloat(entryPrice) : null,
      target_price: targetPrice ? parseFloat(targetPrice) : null,
      stop_loss_price: stopLossPrice ? parseFloat(stopLossPrice) : null,
      tags,
    };

    if (isEditing) {
      updateJournal.mutate(
        { id: journal.id, ...body },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createJournal.mutate(body, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createJournal.isPending || updateJournal.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "저널 수정" : "새 저널 작성"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">제목 *</label>
            <Input
              placeholder="저널 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">유형</label>
            <div className="flex gap-1.5">
              {JOURNAL_TYPES.map((t) => (
                <Button
                  key={t.value}
                  variant={type === t.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setType(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">종목코드</label>
            <Input
              placeholder="예: 005930"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">내용</label>
            <textarea
              className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="투자 판단, 분석, 복기 내용..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">진입가</label>
              <Input
                type="number"
                placeholder="0"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">목표가</label>
              <Input
                type="number"
                placeholder="0"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">손절가</label>
              <Input
                type="number"
                placeholder="0"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                className="tabular-nums"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">태그</label>
            <Input
              placeholder="쉼표로 구분 (예: 반도체, 장기투자)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>취소</DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
