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
import { useCreateCashFlow } from "./hooks";

export function AddCashFlowDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [accountNo, setAccountNo] = useState("");
  const [flowType, setFlowType] = useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const createCashFlow = useCreateCashFlow();

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!date || !accountNo || isNaN(numAmount)) return;

    createCashFlow.mutate(
      {
        date,
        account_no: accountNo,
        flow_type: flowType,
        amount: flowType === "withdrawal" ? -Math.abs(numAmount) : Math.abs(numAmount),
        currency: "KRW",
        description: description || null,
        is_investment_related: true,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setAmount("");
          setDescription("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="mr-2 size-4" />
        현금흐름 추가
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>현금흐름 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">날짜</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">계좌번호</label>
            <Input
              placeholder="계좌번호"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">유형</label>
            <div className="flex gap-2">
              <Button
                variant={flowType === "deposit" ? "default" : "outline"}
                size="sm"
                onClick={() => setFlowType("deposit")}
              >
                입금
              </Button>
              <Button
                variant={flowType === "withdrawal" ? "default" : "outline"}
                size="sm"
                onClick={() => setFlowType("withdrawal")}
              >
                출금
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">금액</label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">설명</label>
            <Input
              placeholder="설명 (선택)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>취소</DialogClose>
          <Button onClick={handleSubmit} disabled={createCashFlow.isPending}>
            {createCashFlow.isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
