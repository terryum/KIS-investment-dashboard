import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AccountManager, getOrRefreshToken, sanitizeError } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';

/**
 * GET /api/market/opinions
 * Fetch investment opinions (analyst target prices) via KIS FHKST663300C0.
 * ?ticker= required domestic stock ticker
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const ticker = request.nextUrl.searchParams.get('ticker');
    if (!ticker) {
      return NextResponse.json(
        { error: 'ticker parameter is required' },
        { status: 400 },
      );
    }

    const manager = new AccountManager(supabaseAdmin);
    const accounts = await manager.getActiveAccounts();
    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No active accounts' },
        { status: 500 },
      );
    }

    const account = accounts[0];
    const token = await getOrRefreshToken(
      account.id,
      account.app_key,
      account.app_secret,
      supabaseAdmin,
    );

    const params = new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: ticker,
    });

    const url = `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/invest-opinion?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        authorization: `Bearer ${token}`,
        appkey: account.app_key,
        appsecret: account.app_secret,
        tr_id: 'FHKST663300C0',
        custtype: 'P',
      },
    });

    const json = await res.json();
    if (json.rt_cd !== '0') {
      throw new Error(json.msg1 || 'KIS API error');
    }

    return NextResponse.json({
      data: { output: json.output1 ?? json.output, msg1: json.msg1 },
    });
  } catch (err) {
    const sanitized = sanitizeError(err);
    return NextResponse.json(
      { error: sanitized.message, code: sanitized.code },
      { status: 500 },
    );
  }
}
