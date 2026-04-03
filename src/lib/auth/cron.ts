import { NextResponse } from 'next/server';

/**
 * Cron job authentication middleware.
 * Verifies the Authorization: Bearer <CRON_SECRET> header.
 *
 * Usage in cron API routes:
 *   const authError = withCronAuth(request);
 *   if (authError) return authError;
 */
export function withCronAuth(request: Request): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  return null; // authenticated
}
