"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface AIPortfolioCommentProps {
  comment: string | null;
  isLoading?: boolean;
}

export function AIPortfolioComment({
  comment,
  isLoading,
}: AIPortfolioCommentProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          AI 포트폴리오 코멘트
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : comment ? (
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {comment}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            AI 코멘트가 없습니다. 뉴스 데이터가 충분히 수집되면 자동으로
            생성됩니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
