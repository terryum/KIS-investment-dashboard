import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AccountManager, getOrRefreshToken, sanitizeError } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';

/**
 * GET /api/market/dividend-rank
 * Fetch dividend rate ranking via KIS HHKDB13470100.
 * ?market=ALL|KRX optional market filter
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const market = request.nextUrl.searchParams.get('market') ?? 'ALL';

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
      FID_COND_SCR_DIV_CODE: '20174',
      FID_INPUT_ISCD: '',
      FID_DIV_CLS_CODE: '0',
      FID_BLNG_CLS_CODE: '0',
      FID_TRGT_CLS_CODE: market === 'KRX' ? '0' : '',
      FID_TRGT_EXLS_CLS_CODE: '',
      FID_INPUT_PRICE_1: '',
      FID_INPUT_PRICE_2: '',
      FID_VOL_CNT: '',
      FID_INPUT_DATE_1: '',
    });

    const url = `${KIS_BASE_URL}/uapi/domestic-stock/v1/ranking/dividend-rate?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        authorization: `Bearer ${token}`,
        appkey: account.app_key,
        appsecret: account.app_secret,
        tr_id: 'HHKDB13470100',
        custtype: 'P',
      },
    });

    const json = await res.json();
    if (json.rt_cd !== '0') {
      throw new Error(json.msg1 || 'KIS API error');
    }

    return NextResponse.json({
      data: { output: json.output ?? json.output1, msg1: json.msg1 },
    });
  } catch (err) {
    const sanitized = sanitizeError(err);
    return NextResponse.json(
      { error: sanitized.message, code: sanitized.code },
      { status: 500 },
    );
  }
}
