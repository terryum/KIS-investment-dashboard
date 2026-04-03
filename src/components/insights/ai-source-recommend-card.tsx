"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ExternalLink } from "lucide-react";
import { SourcePerspectiveTag } from "./source-perspective-tag";
import { useRecommendSources, useCreateSource, type SourceRecommendation } from "./hooks";
import { useState } from "react";

export function AISourceRecommendCard() {
  const recommend = useRecommendSources();
  const createSource = useCreateSource();
  const [recommendations, setRecommendations] = useState<SourceRecommendation[]>([]);

  const handleRecommend = () => {
    recommend.mutate(
      { language: "ko" },
      {
        onSuccess: (data) => {
          if (Array.isArray(data)) {
            setRecommendations(data);
          }
        },
      },
    );
  };

  const handleAdd = (rec: SourceRecommendation) => {
    createSource.mutate({
      name: rec.name,
      url: rec.url,
      type: rec.type,
      perspective: rec.perspective,
      language: rec.language,
      topics: rec.topics,
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            AI 소스 추천
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecommend}
            disabled={recommend.isPending}
          >
            {recommend.isPending ? "추천 중..." : "추천받기"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            AI가 다양한 관점의 투자 소스를 추천합니다.
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={`${rec.name}-${i}`}
                className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{rec.name}</span>
                    {rec.url && (
                      <a
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {rec.type}
                    </Badge>
                    <SourcePerspectiveTag perspective={rec.perspective} />
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleAdd(rec)}
                  disabled={createSource.isPending}
                >
                  추가
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
