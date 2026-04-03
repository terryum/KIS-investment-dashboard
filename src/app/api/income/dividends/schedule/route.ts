import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AccountManager, sanitizeError } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/income/dividends/schedule
 * KSD dividend schedule (HHKDB669102C0).
 * Query: ?ticker= (optional, filter by ticker)
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const ticker = request.nextUrl.searchParams.get('ticker');
    const manager = new AccountManager(supabaseAdmin);
    const accounts = await manager.getActiveAccounts();

    if (accounts.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const account = accounts[0];
    const client = await manager.createClient(account);
    const [cano, productCode] = account.account_no.split('-');

    const params = new URLSearchParams({
      SHT_CD: ticker ?? '',
      HIGH_GB: '',
      CTS: '',
    });

    // Use the KIS client's internal request mechanism via a raw fetch
    // since HHKDB669102C0 is not a standard method on KISClient
    const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';
    const res = await fetch(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/ksdinfo/dividend?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          authorization: `Bearer ${(client as any).accessToken}`,
          appkey: account.app_key,
          appsecret: account.app_secret,
          tr_id: 'HHKDB669102C0',
          custtype: 'P',
        },
      },
    );

    const json = await res.json();

    if (json.rt_cd !== '0') {
      return NextResponse.json(
        { error: 'Failed to fetch dividend schedule' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: json.output1 ?? [] });
  } catch (err) {
    const sanitized = sanitizeError(err);
    return NextResponse.json(
      { error: sanitized.message },
      { status: 500 },
    );
  }
}
