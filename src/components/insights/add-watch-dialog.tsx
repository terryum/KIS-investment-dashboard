"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateWatchlistItem } from "./hooks";

export function AddWatchDialog() {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [targetPrice, setTargetPrice] = useState("");

  const create = useCreateWatchlistItem();

  const handleSubmit = () => {
    if (!ticker) return;
    create.mutate(
      {
        ticker,
        name: name || undefined,
        reason: reason || undefined,
        target_price: targetPrice ? parseFloat(targetPrice) : undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setTicker("");
          setName("");
          setReason("");
          setTargetPrice("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="mr-2 size-4" />
        관심 종목 추가
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>관심 종목 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">종목코드 *</label>
            <Input
              placeholder="예: 005930"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">종목명</label>
            <Input
              placeholder="예: 삼성전자"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">관심 사유</label>
            <Input
              placeholder="매수 검토 이유"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>취소</DialogClose>
          <Button onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
