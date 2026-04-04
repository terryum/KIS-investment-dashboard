import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AccountManager, sanitizeError } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getTodayKST } from '@/lib/utils/kst';

/**
 * GET /api/holdings/current
 * Aggregated holdings across all accounts.
 * Reads from Supabase (today's snapshot) first; falls back to KIS API.
 * Query: ?account_no= (optional, filter by specific account)
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const accountNo = request.nextUrl.searchParams.get('account_no') ?? undefined;
    const today = getTodayKST();

    // 1. Try today's snapshot from Supabase
    let query = supabaseAdmin
      .from('holding_snapshots')
      .select('*')
      .eq('date', today)
      .order('evaluation_amount', { ascending: false });

    if (accountNo) {
      query = query.eq('account_no', accountNo);
    }

    const { data: holdings } = await query;

    if (holdings && holdings.length > 0) {
      return NextResponse.json({
        data: {
          holdings: aggregateHoldings(holdings),
          foreign_cash: [], // Cash info not stored in holding_snapshots
          source: 'supabase',
        },
      });
    }

    // 2. No snapshot today — fall back to KIS API
    const manager = new AccountManager(supabaseAdmin);
    const balance = await manager.fetchUnifiedBalance(accountNo);

    const aggregated = new Map<string, AggregatedHolding>();

    // Domestic holdings
    for (const acct of balance.domestic) {
      for (const h of acct.holdings) {
        const ticker = h.pdno;
        const existing = aggregated.get(ticker);
        const qty = parseFloat(h.hldg_qty) || 0;
        const purchaseAmt = parseFloat(h.pchs_amt) || 0;
        const evalAmt = parseFloat(h.evlu_amt) || 0;
        const pnl = parseFloat(h.evlu_pfls_amt) || 0;

        if (existing) {
          existing.quantity += qty;
          existing.purchase_amount += purchaseAmt;
          existing.evaluation_amount += evalAmt;
          existing.pnl += pnl;
          existing.pnl_percent = existing.purchase_amount > 0
            ? ((existing.evaluation_amount - existing.purchase_amount) / existing.purchase_amount) * 100
            : 0;
        } else {
          aggregated.set(ticker, {
            ticker,
            name: h.prdt_name,
            market: 'KRX',
            quantity: qty,
            purchase_amount: purchaseAmt,
            evaluation_amount: evalAmt,
            pnl,
            pnl_percent: parseFloat(h.evlu_pfls_rt) || 0,
            currency: 'KRW',
            current_price: parseFloat(h.prpr) || 0,
            avg_price: parseFloat(h.pchs_avg_pric) || 0,
          });
        }
      }
    }

    // Overseas holdings
    for (const acct of balance.overseas) {
      for (const h of acct.holdings) {
        const ticker = h.ovrs_pdno;
        const existing = aggregated.get(ticker);
        const qty = parseFloat(h.cblc_qty13) || 0;
        const purchaseAmt = parseFloat(h.frcr_pchs_amt1) || 0;
        const currentPrice = parseFloat(h.ovrs_now_pric1) || 0;
        const evalAmt = qty * currentPrice;
        const pnl = parseFloat(h.frcr_evlu_pfls_amt) || 0;

        if (existing) {
          existing.quantity += qty;
          existing.purchase_amount += purchaseAmt;
          existing.evaluation_amount += evalAmt;
          existing.pnl += pnl;
          existing.pnl_percent = existing.purchase_amount > 0
            ? ((existing.evaluation_amount - existing.purchase_amount) / existing.purchase_amount) * 100
            : 0;
        } else {
          aggregated.set(ticker, {
            ticker,
            name: h.ovrs_item_name,
            market: h.ovrs_excg_cd,
            quantity: qty,
            purchase_amount: purchaseAmt,
            evaluation_amount: evalAmt,
            pnl,
            pnl_percent: parseFloat(h.evlu_pfls_rt1) || 0,
            currency: h.tr_crcy_cd || 'USD',
            current_price: currentPrice,
            avg_price: parseFloat(h.pchs_avg_pric) || 0,
          });
        }
      }
    }

    // Bond holdings
    for (const acct of balance.bonds) {
      for (const h of acct.holdings) {
        const ticker = h.pdno;
        const existing = aggregated.get(ticker);
        const qty = parseFloat(h.bnd_buy_qty) || 0;
        const purchaseAmt = parseFloat(h.pchs_amt) || 0;
        const evalAmt = parseFloat(h.bond_evlu_amt) || 0;
        const pnl = parseFloat(h.evlu_pfls_amt) || 0;

        if (existing) {
          existing.quantity += qty;
          existing.purchase_amount += purchaseAmt;
          existing.evaluation_amount += evalAmt;
          existing.pnl += pnl;
          existing.pnl_percent = existing.purchase_amount > 0
            ? ((existing.evaluation_amount - existing.purchase_amount) / existing.purchase_amount) * 100
            : 0;
        } else {
          aggregated.set(ticker, {
            ticker,
            name: h.prdt_name,
            market: 'BOND',
            quantity: qty,
            purchase_amount: purchaseAmt,
            evaluation_amount: evalAmt,
            pnl,
            pnl_percent: purchaseAmt > 0 ? (pnl / purchaseAmt) * 100 : 0,
            currency: 'KRW',
            current_price: 0,
            avg_price: 0,
          });
        }
      }
    }

    return NextResponse.json({
      data: {
        holdings: Array.from(aggregated.values()),
        foreign_cash: balance.foreignCash.map((c) => ({
          currency: c.currency,
          amount: c.amount,
        })),
        source: 'kis',
      },
    });
  } catch (err) {
    const sanitized = sanitizeError(err);
    return NextResponse.json(
      { error: sanitized.message, code: sanitized.code },
      { status: 500 },
    );
  }
}

interface AggregatedHolding {
  ticker: string;
  name: string;
  market: string;
  quantity: number;
  purchase_amount: number;
  evaluation_amount: number;
  pnl: number;
  pnl_percent: number;
  currency: string;
  current_price: number;
  avg_price: number;
}

/**
 * Aggregate holding_snapshots rows by ticker (across accounts).
 */
function aggregateHoldings(holdings: any[]): AggregatedHolding[] {
  const map = new Map<string, AggregatedHolding>();

  for (const h of holdings) {
    const existing = map.get(h.ticker);
    if (existing) {
      existing.quantity += h.quantity ?? 0;
      existing.purchase_amount += h.purchase_amount ?? 0;
      existing.evaluation_amount += h.evaluation_amount ?? 0;
      existing.pnl += h.pnl ?? 0;
      existing.pnl_percent = existing.purchase_amount > 0
        ? ((existing.evaluation_amount - existing.purchase_amount) / existing.purchase_amount) * 100
        : 0;
      if ((h.current_price ?? 0) > 0) {
        existing.current_price = h.current_price;
      }
    } else {
      map.set(h.ticker, {
        ticker: h.ticker,
        name: h.name ?? '',
        market: h.market ?? '',
        quantity: h.quantity ?? 0,
        purchase_amount: h.purchase_amount ?? 0,
        evaluation_amount: h.evaluation_amount ?? 0,
        pnl: h.pnl ?? 0,
        pnl_percent: h.pnl_percent ?? 0,
        currency: h.currency ?? 'KRW',
        current_price: h.current_price ?? 0,
        avg_price: h.avg_price ?? 0,
      });
    }
  }

  return Array.from(map.values());
}
