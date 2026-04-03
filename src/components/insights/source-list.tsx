"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2 } from "lucide-react";
import { SourcePerspectiveTag } from "./source-perspective-tag";
import type { Source } from "./hooks";
import { useDeleteSource } from "./hooks";

interface SourceListProps {
  sources: Source[];
}

const typeLabels: Record<string, string> = {
  youtube: "YouTube",
  blog: "블로그",
  newsletter: "뉴스레터",
  analyst: "애널리스트",
  news: "뉴스",
  podcast: "팟캐스트",
  twitter: "X/트위터",
  other: "기타",
};

export function SourceList({ sources }: SourceListProps) {
  const deleteSource = useDeleteSource();

  if (sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">팔로우 중인 소스</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            등록된 소스가 없습니다. 소스를 추가해보세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sources.map((source) => (
        <Card key={source.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{source.name}</h3>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {typeLabels[source.type] ?? source.type}
                  </Badge>
                  <SourcePerspectiveTag perspective={source.perspective} />
                  {source.language && (
                    <Badge variant="outline" className="text-[10px]">
                      {source.language === "ko" ? "한국어" : "English"}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => deleteSource.mutate(source.id)}
                disabled={deleteSource.isPending}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            {source.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {source.topics.map((topic) => (
                  <Badge
                    key={topic}
                    variant="outline"
                    className="text-[10px] bg-muted"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
            {source.notes && (
              <p className="text-xs text-muted-foreground">{source.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
