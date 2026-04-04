import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/snapshots/latest-with-holdings
 * Get the most recent snapshot along with its holding_snapshots.
 * Used by change detection to compare current holdings vs last snapshot.
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const { data: snapshot, error } = await supabaseAdmin
      .from('snapshots')
      .select('id, date, snapshot_type, total_value, total_invested, cash_balance, manual_assets_total, unrealized_pnl, created_at')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'No snapshots found' },
        { status: 404 },
      );
    }

    const { data: holdings } = await supabaseAdmin
      .from('holding_snapshots')
      .select('ticker, name, market, quantity, evaluation_amount, currency')
      .eq('snapshot_id', snapshot.id);

    return NextResponse.json({
      data: {
        ...snapshot,
        holding_snapshots: holdings ?? [],
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
