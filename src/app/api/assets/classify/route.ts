import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { classifyETF } from '@/lib/allocation/classifier';

/**
 * POST /api/assets/classify
 * Classify an ETF by its name using the rule-based classifier.
 * Body: { ticker: string, name: string }
 * Optionally saves the classification to assets_master.
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { ticker, name, save } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 },
      );
    }

    const tags = classifyETF(name);
    const tagData = {
      ...tags,
      ai_classified: true,
      ai_classified_at: new Date().toISOString().split('T')[0],
    };

    // Optionally persist to assets_master
    if (save && ticker) {
      await supabaseAdmin
        .from('assets_master')
        .upsert(
          {
            ticker,
            name,
            tags: tagData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'ticker' },
        );
    }

    return NextResponse.json({ data: { ticker, name, tags: tagData } });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
