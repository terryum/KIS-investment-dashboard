import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sanitizeError } from '@/lib/kis';

/**
 * GET /api/market/news
 * Fetch news for held tickers.
 * ?ticker= optional filter for specific ticker
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const ticker = request.nextUrl.searchParams.get('ticker');

    // Fetch news from market_content, optionally filtered by ticker
    let query = supabaseAdmin
      .from('market_content')
      .select('id, title, url, summary, relevance_score, related_tickers, published_at, source_id')
      .order('published_at', { ascending: false })
      .limit(50);

    if (ticker) {
      query = query.contains('related_tickers', [ticker]);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch news' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    const sanitized = sanitizeError(err);
    return NextResponse.json(
      { error: sanitized.message, code: sanitized.code },
      { status: 500 },
    );
  }
}
