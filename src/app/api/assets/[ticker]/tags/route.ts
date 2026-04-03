import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PATCH /api/assets/[ticker]/tags
 * Manually update tags for a specific ticker in assets_master.
 * Body: partial AssetTags object to merge into existing tags.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const { ticker } = await params;
    const body = await request.json();
    const tagUpdates = body.tags;

    if (!tagUpdates || typeof tagUpdates !== 'object') {
      return NextResponse.json(
        { error: 'tags object is required' },
        { status: 400 },
      );
    }

    // Fetch existing record
    const { data: existing } = await supabaseAdmin
      .from('assets_master')
      .select('tags')
      .eq('ticker', ticker)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 },
      );
    }

    const mergedTags = {
      ...(existing.tags ?? {}),
      ...tagUpdates,
      manual_override: true,
    };

    const { data, error } = await supabaseAdmin
      .from('assets_master')
      .update({
        tags: mergedTags,
        updated_at: new Date().toISOString(),
      })
      .eq('ticker', ticker)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update asset tags' },
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
