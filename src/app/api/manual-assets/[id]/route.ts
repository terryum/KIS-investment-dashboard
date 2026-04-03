import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PUT /api/manual-assets/[id]
 * Update a manual asset.
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
    const { category, name, current_value, currency, is_liability, account_no, purchase_amount, valued_at, metadata, notes } = body;

    const updates: Record<string, unknown> = { last_updated_at: new Date().toISOString() };
    if (category !== undefined) updates.category = category;
    if (name !== undefined) updates.name = name;
    if (current_value !== undefined) updates.current_value = current_value;
    if (currency !== undefined) updates.currency = currency;
    if (is_liability !== undefined) updates.is_liability = is_liability;
    if (account_no !== undefined) updates.account_no = account_no;
    if (purchase_amount !== undefined) updates.purchase_amount = purchase_amount;
    if (valued_at !== undefined) updates.valued_at = valued_at;
    if (metadata !== undefined) updates.metadata = metadata;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabaseAdmin
      .from('manual_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update manual asset' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Manual asset not found' },
        { status: 404 },
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
 * DELETE /api/manual-assets/[id]
 * Delete a manual asset.
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
      .from('manual_assets')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete manual asset' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
