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
import { useCreateSource } from "./hooks";

const SOURCE_TYPES = [
  { value: "youtube", label: "YouTube" },
  { value: "blog", label: "블로그" },
  { value: "newsletter", label: "뉴스레터" },
  { value: "analyst", label: "애널리스트" },
  { value: "news", label: "뉴스" },
  { value: "podcast", label: "팟캐스트" },
  { value: "twitter", label: "X/트위터" },
  { value: "other", label: "기타" },
];

const PERSPECTIVES = [
  { value: "bullish", label: "상승" },
  { value: "bearish", label: "하락" },
  { value: "value", label: "가치" },
  { value: "growth", label: "성장" },
  { value: "macro", label: "매크로" },
  { value: "bond", label: "채권" },
  { value: "balanced", label: "균형" },
];

export function AddSourceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("blog");
  const [perspective, setPerspective] = useState("balanced");
  const [notes, setNotes] = useState("");

  const createSource = useCreateSource();

  const handleSubmit = () => {
    if (!name) return;
    createSource.mutate(
      {
        name,
        url: url || undefined,
        type,
        perspective,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setUrl("");
          setNotes("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="mr-2 size-4" />
        소스 추가
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>소스 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">이름 *</label>
            <Input
              placeholder="소스 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">URL</label>
            <Input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">유형</label>
            <div className="flex flex-wrap gap-1.5">
              {SOURCE_TYPES.map((t) => (
                <Button
                  key={t.value}
                  variant={type === t.value ? "default" : "outline"}
                  size="xs"
                  onClick={() => setType(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">관점</label>
            <div className="flex flex-wrap gap-1.5">
              {PERSPECTIVES.map((p) => (
                <Button
                  key={p.value}
                  variant={perspective === p.value ? "default" : "outline"}
                  size="xs"
                  onClick={() => setPerspective(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">메모</label>
            <Input
              placeholder="메모 (선택)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>취소</DialogClose>
          <Button onClick={handleSubmit} disabled={createSource.isPending}>
            {createSource.isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
