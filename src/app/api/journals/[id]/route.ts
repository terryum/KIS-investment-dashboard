import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/journals/[id]
 * Fetch a single journal entry.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('journals')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Journal not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/journals/[id]
 * Update a journal entry.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      ticker,
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
      type?: string;
      title?: string;
      content?: string;
      entry_price?: number | null;
      target_price?: number | null;
      stop_loss_price?: number | null;
      exit_price?: number | null;
      holding_days?: number | null;
      realized_return?: number | null;
      tags?: string[];
      is_pinned?: boolean;
    };

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (ticker !== undefined) updates.ticker = ticker;
    if (type !== undefined) updates.type = type;
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (entry_price !== undefined) updates.entry_price = entry_price;
    if (target_price !== undefined) updates.target_price = target_price;
    if (stop_loss_price !== undefined) updates.stop_loss_price = stop_loss_price;
    if (exit_price !== undefined) updates.exit_price = exit_price;
    if (holding_days !== undefined) updates.holding_days = holding_days;
    if (realized_return !== undefined) updates.realized_return = realized_return;
    if (tags !== undefined) updates.tags = tags;
    if (is_pinned !== undefined) updates.is_pinned = is_pinned;

    const { data, error } = await supabaseAdmin
      .from('journals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to update journal' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/journals/[id]
 * Delete a journal entry.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('journals')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete journal' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
