import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/exchange-rates
 * Get latest exchange rates from the exchange_rates table.
 * Query: ?currency=USD (optional filter)
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const currency = request.nextUrl.searchParams.get('currency');

    // Get the most recent date with rates
    const { data: latestDate } = await supabaseAdmin
      .from('exchange_rates')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (!latestDate) {
      return NextResponse.json({ data: [] });
    }

    let query = supabaseAdmin
      .from('exchange_rates')
      .select('*')
      .eq('date', latestDate.date);

    if (currency) query = query.eq('currency', currency);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch exchange rates' },
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
