import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/manual-assets
 * List all manual assets.
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const { data, error } = await supabaseAdmin
      .from('manual_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch manual assets' },
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
 * POST /api/manual-assets
 * Create a new manual asset.
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { category, name, current_value, currency, is_liability, account_no, purchase_amount, valued_at, metadata, notes } = body;

    if (!category || !name || current_value == null) {
      return NextResponse.json(
        { error: 'category, name, and current_value are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('manual_assets')
      .insert({
        category,
        name,
        current_value,
        currency: currency ?? 'KRW',
        is_liability: is_liability ?? false,
        account_no: account_no ?? null,
        purchase_amount: purchase_amount ?? null,
        valued_at: valued_at ?? null,
        metadata: metadata ?? {},
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create manual asset' },
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
