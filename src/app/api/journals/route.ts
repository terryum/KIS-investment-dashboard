import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

const VALID_JOURNAL_TYPES = ['entry', 'exit', 'note', 'review'];

/**
 * GET /api/journals
 * List journals with filters.
 * ?ticker= filter by ticker
 * ?type=entry|exit|note|review
 * ?tag= filter by tag (contained in tags JSONB array)
 * ?q= full-text search in title/content
 * ?limit= default 50
 * ?offset= default 0
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = request.nextUrl;
    const ticker = searchParams.get('ticker');
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');
    const q = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    let query = supabaseAdmin
      .from('journals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (ticker) {
      query = query.eq('ticker', ticker);
    }

    if (type && VALID_JOURNAL_TYPES.includes(type)) {
      query = query.eq('type', type);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (q) {
      // Search in title and content using ilike
      query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch journals' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data ?? [], count });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/journals
 * Create a new journal entry.
 * Body: { ticker?, transaction_id?, type, title, content?, entry_price?,
 *         target_price?, stop_loss_price?, exit_price?, holding_days?,
 *         realized_return?, tags?, is_pinned? }
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      ticker,
      transaction_id,
      type,
      title,
      content,
      entry_price,
      target_price,
      stop_loss_price,
      exit_price,
      holding_days,
      realized_return,
      tags,
      is_pinned,
    } = body as {
      ticker?: string;
      transaction_id?: string;
      type: string;
      title: string;
      content?: string;
      entry_price?: number;
      target_price?: number;
      stop_loss_price?: number;
      exit_price?: number;
      holding_days?: number;
      realized_return?: number;
      tags?: string[];
      is_pinned?: boolean;
    };

    if (!title || !type) {
      return NextResponse.json(
        { error: 'title and type are required' },
        { status: 400 },
      );
    }

    if (!VALID_JOURNAL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_JOURNAL_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('journals')
      .insert({
        ticker: ticker ?? null,
        transaction_id: transaction_id ?? null,
        type,
        title,
        content: content ?? null,
        entry_price: entry_price ?? null,
        target_price: target_price ?? null,
        stop_loss_price: stop_loss_price ?? null,
        exit_price: exit_price ?? null,
        holding_days: holding_days ?? null,
        realized_return: realized_return ?? null,
        tags: tags ?? [],
        is_pinned: is_pinned ?? false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create journal' },
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
