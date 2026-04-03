"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { NewsItem } from "./hooks";

interface NewsFeedProps {
  news: NewsItem[];
}

export function NewsFeed({ news }: NewsFeedProps) {
  if (news.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">뉴스</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            관련 뉴스가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">뉴스</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {news.map((item) => (
          <div
            key={item.id}
            className="space-y-1.5 border-b pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium leading-snug">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline inline-flex items-center gap-1"
                  >
                    {item.title}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : (
                  item.title
                )}
              </h3>
            </div>
            {item.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.summary}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {item.related_tickers?.map((ticker) => (
                <Badge
                  key={ticker}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  {ticker}
                </Badge>
              ))}
              <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
                {new Date(item.published_at).toLocaleDateString("ko-KR")}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
