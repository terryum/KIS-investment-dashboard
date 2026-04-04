import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AccountManager, sanitizeError } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';
import { fetchExchangeRates } from '@/lib/exchange';
import { compareSnapshots, validateSnapshot } from '@/lib/snapshot';
import type {
  HoldingSnapshot,
  SnapshotSummary,
  SnapshotChanges,
  ValidationWarning,
} from '@/lib/snapshot';
import { getTodayKST } from '@/lib/utils/kst';

/**
 * POST /api/snapshots/load-today
 *
 * The ONE heavy endpoint called on daily first login.
 * - If today's snapshot exists in Supabase, return it (cache hit).
 * - If not, call KIS API, save snapshot, compare with previous, validate.
 * - On KIS failure, fall back to most recent previous snapshot.
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  const today = getTodayKST();

  try {
    // 1. Check if today's snapshot already exists
    const { data: existingSnapshot } = await supabaseAdmin
      .from('snapshots')
      .select('*')
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSnapshot) {
      // Fetch holdings for this snapshot
      const { data: holdings } = await supabaseAdmin
        .from('holding_snapshots')
        .select('*')
        .eq('snapshot_id', existingSnapshot.id)
        .order('evaluation_amount', { ascending: false });

      return NextResponse.json({
        data: {
          snapshot: existingSnapshot,
          holdings: holdings ?? [],
          changes: existingSnapshot.details?.changes ?? null,
          warnings: existingSnapshot.details?.warnings ?? [],
          source: 'cache',
        },
      });
    }

    // 2. No snapshot today — fetch from KIS
    let balance;
    try {
      const manager = new AccountManager(supabaseAdmin);
      balance = await manager.fetchUnifiedBalance();
    } catch (kisErr) {
      // KIS failure: fall back to most recent previous snapshot
      return await returnFallbackSnapshot(today);
    }

    // 3. Fetch exchange rates
    const rates = await fetchExchangeRates();
    const rateMap = new Map(rates.map((r) => [r.currency, r.rate]));

    // 4. Calculate totals
    let totalValue = 0;
    let totalInvested = 0;
    let cashBalance = 0;

    for (const acct of balance.domestic) {
      if (acct.summary) {
        totalValue += parseFloat(acct.summary.tot_evlu_amt) || 0;
        totalInvested += parseFloat(acct.summary.pchs_amt_smtl_amt) || 0;
        cashBalance += parseFloat(acct.summary.dnca_tot_amt) || 0;
      }
    }

    for (const acct of balance.overseas) {
      if (acct.summary) {
        totalValue += parseFloat(acct.summary.ovrs_stck_evlu_amt) || 0;
        totalInvested += parseFloat(acct.summary.frcr_pchs_amt1) || 0;
      }
    }

    for (const acct of balance.bonds) {
      for (const bond of acct.holdings) {
        totalValue += parseFloat(bond.bond_evlu_amt) || 0;
        totalInvested += parseFloat(bond.pchs_amt) || 0;
      }
    }

    for (const cash of balance.foreignCash) {
      cashBalance += cash.amount;
    }

    // Manual assets
    const { data: manualAssets } = await supabaseAdmin
      .from('manual_assets')
      .select('current_value, is_liability');

    let manualAssetsTotal = 0;
    for (const asset of manualAssets ?? []) {
      const val = asset.current_value ?? 0;
      manualAssetsTotal += asset.is_liability ? -val : val;
    }
    totalValue += manualAssetsTotal;

    // 5. Build holding rows with REAL exchange rates
    const holdingRows = buildHoldingRows(balance, today, rateMap);

    // 6. Fetch previous snapshot for comparison
    const { data: prevSnapshot } = await supabaseAdmin
      .from('snapshots')
      .select('*')
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    let prevHoldings: HoldingSnapshot[] = [];
    if (prevSnapshot) {
      const { data } = await supabaseAdmin
        .from('holding_snapshots')
        .select('*')
        .eq('snapshot_id', prevSnapshot.id);
      prevHoldings = (data ?? []) as HoldingSnapshot[];
    }

    // 7. Compare and validate
    const changes: SnapshotChanges | null = prevHoldings.length > 0
      ? compareSnapshots(prevHoldings, holdingRows as unknown as HoldingSnapshot[])
      : null;

    const currentSummary: SnapshotSummary = {
      id: '',
      date: today,
      snapshot_type: 'daily',
      label: null,
      total_value: totalValue,
      total_invested: totalInvested,
      cash_balance: cashBalance,
      manual_assets_total: manualAssetsTotal,
      unrealized_pnl: totalValue - totalInvested - cashBalance - manualAssetsTotal,
      realized_pnl_ytd: 0,
      net_cash_inflow: 0,
      details: null,
      created_at: new Date().toISOString(),
    };

    const warnings: ValidationWarning[] = validateSnapshot(
      prevSnapshot as SnapshotSummary | null,
      currentSummary,
      prevHoldings.length,
      holdingRows.length,
    );

    // 8. Insert snapshot with changes in details
    const { data: snapshot, error: snapshotError } = await supabaseAdmin
      .from('snapshots')
      .insert({
        date: today,
        snapshot_type: 'daily',
        total_value: totalValue,
        total_invested: totalInvested,
        cash_balance: cashBalance,
        manual_assets_total: manualAssetsTotal,
        unrealized_pnl: totalValue - totalInvested - cashBalance - manualAssetsTotal,
        details: {
          changes: changes ?? undefined,
          warnings: warnings.length > 0 ? warnings : undefined,
          exchange_rates: Object.fromEntries(rateMap),
        },
      })
      .select()
      .single();

    if (snapshotError) {
      return NextResponse.json(
        { error: 'Failed to create daily snapshot' },
        { status: 500 },
      );
    }

    // 9. Insert holding snapshots
    if (holdingRows.length > 0) {
      const rowsWithSnapshotId = holdingRows.map((row) => ({
        ...row,
        snapshot_id: snapshot.id,
      }));
      const { error: holdingsError } = await supabaseAdmin
        .from('holding_snapshots')
        .insert(rowsWithSnapshotId);

      if (holdingsError) {
        console.error('Failed to insert holding snapshots:', holdingsError.message);
      }
    }

    return NextResponse.json(
      {
        data: {
          snapshot,
          holdings: holdingRows.map((row) => ({ ...row, snapshot_id: snapshot.id })),
          changes,
          warnings,
          source: 'fresh',
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const sanitized = sanitizeError(err);
    // On any unexpected error, try fallback
    try {
      return await returnFallbackSnapshot(today);
    } catch {
      return NextResponse.json(
        { error: sanitized.message },
        { status: 500 },
      );
    }
  }
}

/**
 * Return the most recent previous snapshot as a fallback.
 */
async function returnFallbackSnapshot(today: string) {
  const { data: prevSnapshot } = await supabaseAdmin
    .from('snapshots')
    .select('*')
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prevSnapshot) {
    return NextResponse.json(
      { error: 'No snapshot available and KIS API is unreachable' },
      { status: 503 },
    );
  }

  const { data: holdings } = await supabaseAdmin
    .from('holding_snapshots')
    .select('*')
    .eq('snapshot_id', prevSnapshot.id)
    .order('evaluation_amount', { ascending: false });

  return NextResponse.json({
    data: {
      snapshot: prevSnapshot,
      holdings: holdings ?? [],
      changes: null,
      warnings: [
        {
          code: 'KIS_FALLBACK',
          message: 'KIS API unavailable. Showing last available snapshot.',
          severity: 'warning',
        },
      ],
      source: 'fallback',
      lastUpdated: prevSnapshot.date,
    },
  });
}

/**
 * Build holding snapshot rows from UnifiedBalance with real exchange rates.
 */
function buildHoldingRows(
  balance: import('@/lib/kis').UnifiedBalance,
  date: string,
  rateMap: Map<string, number>,
) {
  const rows: Omit<HoldingSnapshotRow, 'snapshot_id'>[] = [];

  for (const acct of balance.domestic) {
    for (const h of acct.holdings) {
      rows.push({
        date,
        account_no: acct.accountNo,
        ticker: h.pdno,
        name: h.prdt_name,
        market: 'KRX',
        asset_type: 'stock',
        quantity: parseFloat(h.hldg_qty) || 0,
        avg_price: parseFloat(h.pchs_avg_pric) || 0,
        current_price: parseFloat(h.prpr) || 0,
        purchase_amount: parseFloat(h.pchs_amt) || 0,
        evaluation_amount: parseFloat(h.evlu_amt) || 0,
        pnl: parseFloat(h.evlu_pfls_amt) || 0,
        pnl_percent: parseFloat(h.evlu_pfls_rt) || 0,
        currency: 'KRW',
        exchange_rate: 1,
      });
    }
  }

  for (const acct of balance.overseas) {
    for (const h of acct.holdings) {
      const currency = h.tr_crcy_cd || 'USD';
      const exchangeRate = rateMap.get(currency) ?? rateMap.get('USD') ?? 1;
      const qty = parseFloat(h.cblc_qty13) || 0;
      const price = parseFloat(h.ovrs_now_pric1) || 0;

      rows.push({
        date,
        account_no: acct.accountNo,
        ticker: h.ovrs_pdno,
        name: h.ovrs_item_name,
        market: h.ovrs_excg_cd,
        asset_type: 'stock',
        quantity: qty,
        avg_price: parseFloat(h.pchs_avg_pric) || 0,
        current_price: price,
        purchase_amount: parseFloat(h.frcr_pchs_amt1) || 0,
        evaluation_amount: qty * price || 0,
        pnl: parseFloat(h.frcr_evlu_pfls_amt) || 0,
        pnl_percent: parseFloat(h.evlu_pfls_rt1) || 0,
        currency,
        exchange_rate: exchangeRate,
      });
    }
  }

  for (const acct of balance.bonds) {
    for (const h of acct.holdings) {
      rows.push({
        date,
        account_no: acct.accountNo,
        ticker: h.pdno,
        name: h.prdt_name,
        market: 'BOND',
        asset_type: 'bond',
        quantity: parseFloat(h.bnd_buy_qty) || 0,
        avg_price: 0,
        current_price: 0,
        purchase_amount: parseFloat(h.pchs_amt) || 0,
        evaluation_amount: parseFloat(h.bond_evlu_amt) || 0,
        pnl: parseFloat(h.evlu_pfls_amt) || 0,
        pnl_percent: 0,
        currency: 'KRW',
        exchange_rate: 1,
      });
    }
  }

  return rows;
}

interface HoldingSnapshotRow {
  snapshot_id: string;
  date: string;
  account_no: string;
  ticker: string;
  name: string;
  market: string;
  asset_type: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  purchase_amount: number;
  evaluation_amount: number;
  pnl: number;
  pnl_percent: number;
  currency: string;
  exchange_rate: number;
}
