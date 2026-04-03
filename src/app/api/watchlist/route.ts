import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/watchlist
 * List watchlist items.
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const { data, error } = await supabaseAdmin
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch watchlist' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/watchlist
 * Add a ticker to watchlist.
 * Body: { ticker, name?, market?, reason?, target_price?, alert_enabled? }
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { ticker, name, market, reason, target_price, alert_enabled } =
      body as {
        ticker: string;
        name?: string;
        market?: string;
        reason?: string;
        target_price?: number;
        alert_enabled?: boolean;
      };

    if (!ticker) {
      return NextResponse.json(
        { error: 'ticker is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('watchlist')
      .insert({
        ticker,
        name: name ?? null,
        market: market ?? null,
        reason: reason ?? null,
        target_price: target_price ?? null,
        alert_enabled: alert_enabled ?? false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to add to watchlist' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
