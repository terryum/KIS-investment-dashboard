"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Journal } from "./hooks";

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

interface JournalCardProps {
  journal: Journal;
  onClick: () => void;
}

export function JournalCard({ journal, onClick }: JournalCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              {journal.is_pinned && (
                <Pin className="size-3 text-primary shrink-0" />
              )}
              <h3 className="text-sm font-medium truncate">{journal.title}</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn("text-[10px]", typeColors[journal.type])}
              >
                {typeLabels[journal.type] ?? journal.type}
              </Badge>
              {journal.ticker && (
                <Badge variant="outline" className="text-[10px]">
                  {journal.ticker}
                </Badge>
              )}
              {journal.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] bg-muted"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {new Date(journal.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
        {journal.content && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {journal.content}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
