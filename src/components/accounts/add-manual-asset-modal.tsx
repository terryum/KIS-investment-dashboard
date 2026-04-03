"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddManualAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  "부동산",
  "예금",
  "적금",
  "보험",
  "연금",
  "현금",
  "대출",
  "기타",
];

export function AddManualAssetModal({
  open,
  onOpenChange,
}: AddManualAssetModalProps) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [name, setName] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [isLiability, setIsLiability] = useState(false);
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/manual-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name,
          current_value: parseFloat(currentValue),
          is_liability: isLiability,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create manual asset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-assets"] });
      onOpenChange(false);
      resetForm();
    },
  });

  function resetForm() {
    setCategory(CATEGORIES[0]);
    setName("");
    setCurrentValue("");
    setIsLiability(false);
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>수동 자산 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs text-muted-foreground">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">자산명</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 전세 보증금"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">금액 (원)</label>
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="10000000"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-liability"
              checked={isLiability}
              onChange={(e) => setIsLiability(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="is-liability" className="text-sm">
              부채 (마이너스 자산)
            </label>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">메모</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="선택사항"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!name || !currentValue || mutation.isPending}
          >
            {mutation.isPending ? "저장 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
