import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/market/sources
 * List followed market insight sources.
 * ?type= optional filter by source_type
 * ?active= optional filter (default true)
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const type = request.nextUrl.searchParams.get('type');
    const active = request.nextUrl.searchParams.get('active') !== 'false';

    let query = supabaseAdmin
      .from('market_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (active) {
      query = query.eq('is_active', true);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch sources' },
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
 * POST /api/market/sources
 * Add a new market source.
 * Body: { name, url?, type, perspective?, language?, topics?, notes? }
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, url, type, perspective, language, topics, notes } = body as {
      name: string;
      url?: string;
      type: string;
      perspective?: string;
      language?: string;
      topics?: string[];
      notes?: string;
    };

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('market_sources')
      .insert({
        name,
        url: url ?? null,
        type,
        perspective: perspective ?? 'balanced',
        language: language ?? 'ko',
        topics: topics ?? [],
        notes: notes ?? null,
        added_by: 'user',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create source' },
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
