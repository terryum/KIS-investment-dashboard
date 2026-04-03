import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PUT /api/cash-flows/[id]
 * Update a cash flow record.
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
    const { date, account_no, flow_type, amount, currency, description, is_investment_related } = body;

    const updates: Record<string, unknown> = {};
    if (date !== undefined) updates.date = date;
    if (account_no !== undefined) updates.account_no = account_no;
    if (flow_type !== undefined) updates.flow_type = flow_type;
    if (amount !== undefined) updates.amount = amount;
    if (currency !== undefined) updates.currency = currency;
    if (description !== undefined) updates.description = description;
    if (is_investment_related !== undefined) updates.is_investment_related = is_investment_related;

    const { data, error } = await supabaseAdmin
      .from('cash_flows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update cash flow' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Cash flow not found' },
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
 * DELETE /api/cash-flows/[id]
 * Delete a cash flow record.
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
      .from('cash_flows')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete cash flow' },
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
