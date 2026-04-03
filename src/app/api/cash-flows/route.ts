import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/cash-flows
 * List cash flow records.
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&account_no=
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    const accountNo = request.nextUrl.searchParams.get('account_no');

    let query = supabaseAdmin
      .from('cash_flows')
      .select('*')
      .order('date', { ascending: false });

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    if (accountNo) query = query.eq('account_no', accountNo);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch cash flows' },
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

/**
 * POST /api/cash-flows
 * Create a cash flow record.
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { date, account_no, flow_type, amount, currency, description, is_investment_related } = body;

    if (!date || !account_no || !flow_type || amount == null) {
      return NextResponse.json(
        { error: 'date, account_no, flow_type, and amount are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('cash_flows')
      .insert({
        date,
        account_no,
        flow_type,
        amount,
        currency: currency ?? 'KRW',
        description: description ?? null,
        is_investment_related: is_investment_related ?? false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create cash flow' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
