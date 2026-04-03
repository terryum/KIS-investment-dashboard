import { NextResponse, type NextRequest } from 'next/server';
import { withCronAuth } from '@/lib/auth/cron';
import { AccountManager, sanitizeError } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/cron/weekly-snapshot
 * Cron: Capture weekly snapshot (every Friday 16:00 KST).
 */
export async function POST(request: NextRequest) {
  const authError = withCronAuth(request);
  if (authError) return authError;

  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch current balances
    const manager = new AccountManager(supabaseAdmin);
    const balance = await manager.fetchUnifiedBalance();

    // Calculate totals
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

    // Net cash inflow for the week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const { data: weekFlows } = await supabaseAdmin
      .from('cash_flows')
      .select('amount')
      .neq('flow_type', 'internal')
      .gte('date', oneWeekAgo.toISOString().split('T')[0]);

    const netCashInflow = (weekFlows ?? []).reduce(
      (sum: number, f: any) => sum + (parseFloat(f.amount) || 0),
      0,
    );

    // Insert snapshot
    const { data: snapshot, error: snapshotError } = await supabaseAdmin
      .from('snapshots')
      .upsert(
        {
          date: today,
          snapshot_type: 'weekly',
          total_value: totalValue,
          total_invested: totalInvested,
          cash_balance: cashBalance,
          manual_assets_total: manualAssetsTotal,
          unrealized_pnl: totalValue - totalInvested - cashBalance - manualAssetsTotal,
          net_cash_inflow: netCashInflow,
        },
        { onConflict: 'date,snapshot_type' },
      )
      .select()
      .single();

    if (snapshotError) {
      return NextResponse.json(
        { error: 'Failed to create weekly snapshot' },
        { status: 500 },
      );
    }

    // Insert holding snapshots
    const holdingRows: any[] = [];

    for (const acct of balance.domestic) {
      for (const h of acct.holdings) {
        holdingRows.push({
          snapshot_id: snapshot.id,
          date: today,
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
        holdingRows.push({
          snapshot_id: snapshot.id,
          date: today,
          account_no: acct.accountNo,
          ticker: h.ovrs_pdno,
          name: h.ovrs_item_name,
          market: h.ovrs_excg_cd,
          asset_type: 'stock',
          quantity: parseFloat(h.cblc_qty13) || 0,
          avg_price: parseFloat(h.pchs_avg_pric) || 0,
          current_price: parseFloat(h.ovrs_now_pric1) || 0,
          purchase_amount: parseFloat(h.frcr_pchs_amt1) || 0,
          evaluation_amount: parseFloat(h.cblc_qty13) * parseFloat(h.ovrs_now_pric1) || 0,
          pnl: parseFloat(h.frcr_evlu_pfls_amt) || 0,
          pnl_percent: parseFloat(h.evlu_pfls_rt1) || 0,
          currency: h.tr_crcy_cd || 'USD',
          exchange_rate: 1,
        });
      }
    }

    for (const acct of balance.bonds) {
      for (const h of acct.holdings) {
        holdingRows.push({
          snapshot_id: snapshot.id,
          date: today,
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

    if (holdingRows.length > 0) {
      await supabaseAdmin.from('holding_snapshots').insert(holdingRows);
    }

    return NextResponse.json({
      data: { snapshot_id: snapshot.id, holdings_count: holdingRows.length },
    });
  } catch (err) {
    const sanitized = sanitizeError(err);
    return NextResponse.json(
      { error: sanitized.message },
      { status: 500 },
    );
  }
}
