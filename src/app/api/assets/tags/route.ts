import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/assets/tags
 * Fetch asset tags from assets_master.
 * Query: ?ticker= (optional, filter by specific ticker)
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const ticker = request.nextUrl.searchParams.get('ticker');

    let query = supabaseAdmin
      .from('assets_master')
      .select('ticker, name, name_en, market_type, asset_class, currency, tags');

    if (ticker) {
      query = query.eq('ticker', ticker);
    }

    const { data, error } = await query.order('ticker');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch asset tags' },
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
