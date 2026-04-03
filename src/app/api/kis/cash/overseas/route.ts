import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AccountManager, sanitizeError, maskAccountNo } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/kis/cash/overseas
 * Foreign cash balance (CTRP6504R) across all accounts.
 * Note: Not supported in paper trading mode.
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const filterAccountNo =
      request.nextUrl.searchParams.get('account_no') ?? undefined;
    const manager = new AccountManager(supabaseAdmin);
    const accounts = await manager.getActiveAccounts();
    const filtered = filterAccountNo
      ? accounts.filter((a) => a.account_no === filterAccountNo)
      : accounts;

    const results = [];

    for (const account of filtered) {
      try {
        const client = await manager.createClient(account);
        const [, productCode] = account.account_no.split('-');
        const foreignCash = await client.getForeignCash(
          account.account_no,
          productCode,
        );
        for (const cash of foreignCash) {
          results.push({
            accountNo: account.account_no,
            ...cash,
          });
        }
      } catch (err) {
        const sanitized = sanitizeError(err, account.account_no);
        console.error(
          `Foreign cash failed [${maskAccountNo(account.account_no)}]:`,
          sanitized.message,
        );
      }
    }

    return NextResponse.json({ data: results });
  } catch (err) {
    const sanitized = sanitizeError(err);
    return NextResponse.json(
      { error: sanitized.message, code: sanitized.code },
      { status: 500 },
    );
  }
}
