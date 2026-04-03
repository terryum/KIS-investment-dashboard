"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { AIPortfolioComment } from "@/components/insights/ai-portfolio-comment";
import { NewsFeed } from "@/components/insights/news-feed";
import { AnalystOpinionsTable } from "@/components/insights/analyst-opinions-table";
import { EstimatedEarningsTable } from "@/components/insights/estimated-earnings-table";
import { SourceList } from "@/components/insights/source-list";
import { AddSourceDialog } from "@/components/insights/add-source-dialog";
import { AISourceRecommendCard } from "@/components/insights/ai-source-recommend-card";
import { WatchlistTable } from "@/components/insights/watchlist-table";
import { AddWatchDialog } from "@/components/insights/add-watch-dialog";
import { useNews, useSources, useWatchlist } from "@/components/insights/hooks";
import { useQuery } from "@tanstack/react-query";

async function fetchKisData(endpoint: string, ticker: string) {
  if (!ticker) return { output: [] };
  const res = await fetch(`${endpoint}?ticker=${ticker}`);
  if (!res.ok) return { output: [] };
  const json = await res.json();
  return json.data ?? { output: [] };
}

export default function InsightsPage() {
  const [opinionTicker, setOpinionTicker] = useState("");
  const { data: news = [] } = useNews();
  const { data: sources = [] } = useSources();
  const { data: watchlist = [] } = useWatchlist();

  const { data: opinionsData } = useQuery({
    queryKey: ["market", "opinions", opinionTicker],
    queryFn: () => fetchKisData("/api/market/opinions", opinionTicker),
    enabled: opinionTicker.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const { data: estimatesData } = useQuery({
    queryKey: ["market", "estimates", opinionTicker],
    queryFn: () => fetchKisData("/api/market/estimates", opinionTicker),
    enabled: opinionTicker.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">마켓 인사이트</h2>

      <Tabs defaultValue="news">
        <TabsList>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          <TabsTrigger value="sources">소스관리</TabsTrigger>
          <TabsTrigger value="watchlist">워치리스트</TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          <div className="space-y-4 pt-4">
            <AIPortfolioComment comment={null} />
            <NewsFeed news={news} />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="종목코드 입력 (예: 005930)"
                  value={opinionTicker}
                  onChange={(e) => setOpinionTicker(e.target.value)}
                  className="max-w-xs tabular-nums"
                />
              </div>
              <AnalystOpinionsTable
                opinions={opinionsData?.output ?? []}
                ticker={opinionTicker}
              />
              <EstimatedEarningsTable
                estimates={estimatesData?.output ?? []}
                ticker={opinionTicker}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sources">
          <div className="space-y-4 pt-4">
            <div className="flex justify-end">
              <AddSourceDialog />
            </div>
            <SourceList sources={sources} />
            <AISourceRecommendCard />
          </div>
        </TabsContent>

        <TabsContent value="watchlist">
          <div className="space-y-4 pt-4">
            <div className="flex justify-end">
              <AddWatchDialog />
            </div>
            <WatchlistTable items={watchlist} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
