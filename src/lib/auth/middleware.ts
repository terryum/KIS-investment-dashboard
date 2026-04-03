import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * PIN authentication middleware.
 * Verifies the x-pin-token header against the stored PIN hash.
 *
 * Usage in API routes:
 *   const authError = await withAuth(request);
 *   if (authError) return authError;
 */
export async function withAuth(
  request: Request,
): Promise<NextResponse | null> {
  const pinToken = request.headers.get('x-pin-token');

  if (!pinToken) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'pin_hash')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'PIN not configured' },
        { status: 500 },
      );
    }

    // pinToken is the SHA-256 hash of the user's PIN, computed client-side
    if (pinToken !== data.value) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 },
      );
    }

    return null; // authenticated
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 },
    );
  }
}
