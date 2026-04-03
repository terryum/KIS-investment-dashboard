import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/income
 * List income records (dividends, distributions, interest).
 * Query: ?year=2026&type=dividend|distribution|interest&account_no=
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const year = request.nextUrl.searchParams.get('year');
    const type = request.nextUrl.searchParams.get('type');
    const accountNo = request.nextUrl.searchParams.get('account_no');

    let query = supabaseAdmin
      .from('income')
      .select('*')
      .order('date', { ascending: false });

    if (year) {
      query = query
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);
    }
    if (type) query = query.eq('type', type);
    if (accountNo) query = query.eq('account_no', accountNo);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch income records' },
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
