import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/snapshots
 * List snapshots with optional date/type filters.
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&type=weekly|manual
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    const type = request.nextUrl.searchParams.get('type');

    let query = supabaseAdmin
      .from('snapshots')
      .select('id, date, snapshot_type, label, total_value, total_invested, cash_balance, manual_assets_total, unrealized_pnl, realized_pnl_ytd, net_cash_inflow, created_at')
      .order('date', { ascending: false });

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    if (type) query = query.eq('snapshot_type', type);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch snapshots' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
