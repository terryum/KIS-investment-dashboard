import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PUT /api/market/sources/[id]
 * Update a market source.
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
    const { name, url, type, perspective, language, topics, notes, is_active } =
      body as {
        name?: string;
        url?: string;
        type?: string;
        perspective?: string;
        language?: string;
        topics?: string[];
        notes?: string;
        is_active?: boolean;
      };

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;
    if (type !== undefined) updates.type = type;
    if (perspective !== undefined) updates.perspective = perspective;
    if (language !== undefined) updates.language = language;
    if (topics !== undefined) updates.topics = topics;
    if (notes !== undefined) updates.notes = notes;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('market_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update source' },
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
 * DELETE /api/market/sources/[id]
 * Delete a market source.
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
      .from('market_sources')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete source' },
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
