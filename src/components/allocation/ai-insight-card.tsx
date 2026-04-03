"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparklesIcon, Loader2Icon } from "lucide-react";

export function AIInsightCard() {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchInsight() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/allocation/insights");
      if (!res.ok) throw new Error("Failed to fetch insights");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setInsight(text);
      }
    } catch {
      setError("AI 인사이트를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4" />
          AI 인사이트
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insight ? (
          <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">
            {insight}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInsight}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <SparklesIcon className="mr-1 h-3 w-3" />
                AI 분석 요청
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
