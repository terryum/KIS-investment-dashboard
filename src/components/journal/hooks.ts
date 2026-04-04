"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const json = await res.json();
  return json;
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

async function putJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update ${url}`);
  const json = await res.json();
  return json.data;
}

async function deleteJson(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete ${url}`);
}

// --- Journal types ---

export interface Journal {
  id: string;
  ticker: string | null;
  transaction_id: string | null;
  type: string;
  title: string;
  content: string | null;
  entry_price: number | null;
  target_price: number | null;
  stop_loss_price: number | null;
  exit_price: number | null;
  holding_days: number | null;
  realized_return: number | null;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalFilters {
  ticker?: string;
  type?: string;
  tag?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export function useJournals(filters: JournalFilters = {}) {
  const params = new URLSearchParams();
  if (filters.ticker) params.set("ticker", filters.ticker);
  if (filters.type) params.set("type", filters.type);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.q) params.set("q", filters.q);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));
  const qs = params.toString();

  return useQuery<{ data: Journal[]; count: number }>({
    queryKey: ["journals", filters],
    queryFn: () => fetchJson(`/api/journals${qs ? `?${qs}` : ""}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useJournal(id: string | null) {
  return useQuery<Journal>({
    queryKey: ["journals", id],
    queryFn: async () => {
      const res = await fetch(`/api/journals/${id}`);
      if (!res.ok) throw new Error("Failed to fetch journal");
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export type JournalInput = {
  ticker?: string | null;
  type: string;
  title: string;
  content?: string | null;
  entry_price?: number | null;
  target_price?: number | null;
  stop_loss_price?: number | null;
  exit_price?: number | null;
  holding_days?: number | null;
  realized_return?: number | null;
  tags?: string[];
  is_pinned?: boolean;
};

export function useCreateJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JournalInput) =>
      postJson<Journal>("/api/journals", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

export function useUpdateJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: JournalInput & { id: string }) =>
      putJson<Journal>(`/api/journals/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

export function useDeleteJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJson(`/api/journals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}
