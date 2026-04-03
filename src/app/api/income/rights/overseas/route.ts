import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { AccountManager, sanitizeError } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';

/**
 * GET /api/income/rights/overseas
 * Overseas period rights (CTRGT011R).
 * Query: ?from=YYYYMMDD&to=YYYYMMDD&rights_type=01|02|03
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const from = request.nextUrl.searchParams.get('from') ?? '';
    const to = request.nextUrl.searchParams.get('to') ?? '';
    const rightsType = request.nextUrl.searchParams.get('rights_type') ?? '03'; // default: 배당

    const manager = new AccountManager(supabaseAdmin);
    const accounts = await manager.getActiveAccounts();
    const allRights: any[] = [];

    for (const account of accounts) {
      const client = await manager.createClient(account);
      const [cano, productCode] = account.account_no.split('-');

      const params = new URLSearchParams({
        CANO: cano,
        ACNT_PRDT_CD: productCode,
        INQR_STRT_DT: from.replace(/-/g, ''),
        INQR_END_DT: to.replace(/-/g, ''),
        RGHT_TYPE: rightsType,
        CTX_AREA_FK100: '',
        CTX_AREA_NK100: '',
      });

      const res = await fetch(
        `${KIS_BASE_URL}/uapi/overseas-price/v1/quotations/period-rights?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            authorization: `Bearer ${(client as any).accessToken}`,
            appkey: account.app_key,
            appsecret: account.app_secret,
            tr_id: 'CTRGT011R',
            custtype: 'P',
          },
        },
      );

      const json = await res.json();
      if (json.rt_cd === '0' && json.output1) {
        allRights.push(...(Array.isArray(json.output1) ? json.output1 : []));
      }
    }

    return NextResponse.json({ data: allRights });
  } catch (err) {
    const sanitized = sanitizeError(err);
    return NextResponse.json(
      { error: sanitized.message },
      { status: 500 },
    );
  }
}
