import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AccountManager, sanitizeError, maskAccountNo } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/kis/bonds
 * Bond balance (CTSC8407R) with pagination across all accounts.
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
        const holdings = await client.getBondBalance(
          account.account_no,
          productCode,
        );
        if (holdings.length > 0) {
          results.push({
            accountNo: account.account_no,
            holdings,
          });
        }
      } catch (err) {
        const sanitized = sanitizeError(err, account.account_no);
        console.error(
          `Bond balance failed [${maskAccountNo(account.account_no)}]:`,
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
