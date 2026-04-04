"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStaleTimeUntil6AM } from "@/lib/utils/cache-time";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const json = await res.json();
  return json.data;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to post ${url}`);
  const json = await res.json();
  return json.data;
}

async function deleteJson(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete ${url}`);
}

// --- News ---

export interface NewsItem {
  id: string;
  title: string;
  url: string | null;
  summary: string | null;
  relevance_score: number | null;
  related_tickers: string[];
  published_at: string;
  source_id: string | null;
}

export function useNews(ticker?: string) {
  const params = new URLSearchParams();
  if (ticker) params.set("ticker", ticker);
  const qs = params.toString();

  return useQuery<NewsItem[]>({
    queryKey: ["market", "news", ticker],
    queryFn: () => fetchJson(`/api/market/news${qs ? `?${qs}` : ""}`),
    staleTime: getStaleTimeUntil6AM(),
  });
}

// --- Sources ---

export interface Source {
  id: string;
  name: string;
  url: string | null;
  type: string;
  perspective: string;
  language: string;
  topics: string[];
  notes: string | null;
  is_active: boolean;
  added_by: string;
  created_at: string;
}

export function useSources() {
  return useQuery<Source[]>({
    queryKey: ["market", "sources"],
    queryFn: () => fetchJson("/api/market/sources"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useCreateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      url?: string;
      type: string;
      perspective?: string;
      language?: string;
      topics?: string[];
      notes?: string;
    }) => postJson<Source>("/api/market/sources", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["market", "sources"] });
    },
  });
}

export function useDeleteSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJson(`/api/market/sources/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["market", "sources"] });
    },
  });
}

export interface SourceRecommendation {
  name: string;
  url: string;
  type: string;
  perspective: string;
  language: string;
  topics: string[];
  reason: string;
}

export function useRecommendSources() {
  return useMutation({
    mutationFn: (body: { topics?: string[]; language?: string }) =>
      postJson<SourceRecommendation[]>("/api/market/sources/recommend", body),
  });
}

// --- Watchlist ---

export interface WatchlistItem {
  id: string;
  ticker: string;
  name: string | null;
  market: string | null;
  reason: string | null;
  target_price: number | null;
  alert_enabled: boolean;
  created_at: string;
}

export function useWatchlist() {
  return useQuery<WatchlistItem[]>({
    queryKey: ["watchlist"],
    queryFn: () => fetchJson("/api/watchlist"),
    staleTime: getStaleTimeUntil6AM(),
  });
}

export function useCreateWatchlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      ticker: string;
      name?: string;
      market?: string;
      reason?: string;
      target_price?: number;
    }) => postJson<WatchlistItem>("/api/watchlist", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useDeleteWatchlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJson(`/api/watchlist/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}
