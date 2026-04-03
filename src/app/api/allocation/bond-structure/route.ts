import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateBondMaturityStructure, calculateBondStrategyStructure } from '@/lib/allocation/bond-analysis';
import type { BondHolding } from '@/lib/allocation/types';

/**
 * GET /api/allocation/bond-structure
 * Bond structure: maturity brackets + HTM/MTM strategy.
 * Query: ?view=maturity|strategy (default: maturity)
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const view = request.nextUrl.searchParams.get('view') ?? 'maturity';
    const items = await fetchBondHoldings();

    const result = view === 'strategy'
      ? calculateBondStrategyStructure(items)
      : calculateBondMaturityStructure(items);

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: 'Failed to calculate bond structure' },
      { status: 500 },
    );
  }
}

async function fetchBondHoldings(): Promise<BondHolding[]> {
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

  const { data: bondInfos } = await supabaseAdmin
    .from('bond_issue_info')
    .select('bond_code, maturity_date, coupon_rate')
    .in('bond_code', tickers);

  const tagsMap = new Map((masters ?? []).map((m: any) => [m.ticker, m.tags]));
  const bondInfoMap = new Map((bondInfos ?? []).map((b: any) => [b.bond_code, b]));

  return data
    .filter((h: any) => tagsMap.has(h.ticker))
    .map((h: any) => {
      const bondInfo = bondInfoMap.get(h.ticker);
      return {
        ticker: h.ticker,
        name: h.name,
        evaluation_amount: h.evaluation_amount,
        currency: h.currency,
        tags: tagsMap.get(h.ticker),
        maturity_date: bondInfo?.maturity_date,
        coupon_rate: bondInfo?.coupon_rate,
      };
    });
}
