import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateCurrencyAllocation } from '@/lib/allocation/currency';
import type { AllocationItem } from '@/lib/allocation/types';

/**
 * GET /api/allocation/currency
 * Currency allocation breakdown.
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const items = await fetchAllocationItems();
    const result = calculateCurrencyAllocation(items);
    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: 'Failed to calculate currency allocation' },
      { status: 500 },
    );
  }
}

async function fetchAllocationItems(): Promise<AllocationItem[]> {
  const { data, error } = await supabaseAdmin
    .from('holdings_cache')
    .select('ticker, name, evaluation_amount, currency')
    .gt('evaluation_amount', 0);

  if (error || !data) return [];

  const tickers = data.map((h: any) => h.ticker);
  const { data: masters } = await supabaseAdmin
    .from('assets_master')
    .select('ticker, tags')
    .in('ticker', tickers);

  const tagsMap = new Map((masters ?? []).map((m: any) => [m.ticker, m.tags]));

  return data
    .filter((h: any) => tagsMap.has(h.ticker))
    .map((h: any) => ({
      ticker: h.ticker,
      name: h.name,
      evaluation_amount: h.evaluation_amount,
      currency: h.currency,
      tags: tagsMap.get(h.ticker),
    }));
}
