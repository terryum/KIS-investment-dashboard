import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/cash-flows/monthly
 * Monthly cash flow summary (uses v_monthly_cash_flows view).
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const { data, error } = await supabaseAdmin
      .from('v_monthly_cash_flows')
      .select('*')
      .order('month', { ascending: false });

    if (error) {
      // Fallback: compute from cash_flows directly
      const { data: flows, error: flowsError } = await supabaseAdmin
        .from('cash_flows')
        .select('month, amount, flow_type')
        .neq('flow_type', 'internal');

      if (flowsError || !flows) {
        return NextResponse.json(
          { error: 'Failed to fetch monthly cash flows' },
          { status: 500 },
        );
      }

      const monthly = new Map<string, { total_inflow: number; total_outflow: number; net_flow: number }>();
      for (const f of flows) {
        const m = f.month;
        const entry = monthly.get(m) ?? { total_inflow: 0, total_outflow: 0, net_flow: 0 };
        const amt = parseFloat(f.amount) || 0;
        if (amt > 0) entry.total_inflow += amt;
        else entry.total_outflow += amt;
        entry.net_flow += amt;
        monthly.set(m, entry);
      }

      const result = Array.from(monthly.entries())
        .map(([month, vals]) => ({ month, ...vals }))
        .sort((a, b) => b.month.localeCompare(a.month));

      return NextResponse.json({ data: result });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
