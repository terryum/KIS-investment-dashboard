import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AccountManager, sanitizeError } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/kis/balance
 * Unified balance across all accounts (domestic + overseas + bonds + foreign cash).
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const accountNo = request.nextUrl.searchParams.get('account_no') ?? undefined;
    const manager = new AccountManager(supabaseAdmin);
    const balance = await manager.fetchUnifiedBalance(accountNo);

    return NextResponse.json({ data: balance });
  } catch (err) {
    const sanitized = sanitizeError(err);
    return NextResponse.json(
      { error: sanitized.message, code: sanitized.code },
      { status: 500 },
    );
  }
}
